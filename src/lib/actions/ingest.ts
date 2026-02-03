'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import {
  EstateLead,
  EstateLeadStatus,
  HeirInfo,
  createDeceasedLeadsTableFinal,
  bulkInsertEstateLeads,
  getEstateLeadStats,
  getImportBatchSummary,
} from '@/lib/db';
import { scoreLead } from '@/lib/scoring';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Raw CSV record from SCO "Estates of Deceased Persons" file.
 * Column names may vary - we normalize them during parsing.
 */
interface RawCSVRecord {
  // Property Identification
  PropertyID?: string;
  PROPERTY_ID?: string;
  'Property ID'?: string;
  RecordID?: string;
  
  // Owner Information
  OwnerName?: string;
  OWNER_NAME?: string;
  'Owner Name'?: string;
  DecedentName?: string;
  
  // Financial
  CurrentBalance?: string | number;
  CURRENT_BALANCE?: string | number;
  'Current Balance'?: string | number;
  Amount?: string | number;
  CashReported?: string | number;
  
  // Location
  County?: string;
  COUNTY?: string;
  
  // Dates
  EscheatDate?: string;
  ESCHEAT_DATE?: string;
  'Escheat Date'?: string;
  DateReported?: string;
  DATE_REPORTED?: string;
  'Date Reported'?: string;
  
  // Property Details
  PropertyType?: string;
  PROPERTY_TYPE?: string;
  'Property Type'?: string;
  HolderName?: string;
  HOLDER_NAME?: string;
  'Holder Name'?: string;
  
  // Address
  Address?: string;
  ADDRESS?: string;
  LastKnownAddress?: string;
  LAST_KNOWN_ADDRESS?: string;
  'Last Known Address'?: string;
  
  // Relation and Heirs - KEY FOR SCORING
  RelationToProperty?: string;
  RELATION_TO_PROPERTY?: string;
  'Relation To Property'?: string;
  Relation?: string;
  
  Heirs?: string;
  HEIRS?: string;
  HeirsListed?: string;
  'Heirs Listed'?: string;
  
  // Allow additional fields
  [key: string]: string | number | undefined;
}

/**
 * Result of the ingestion process.
 */
export interface IngestResult {
  success: boolean;
  batchId: string;
  totalRecords: number;
  filtered: number;
  inserted: number;
  skipped: number;
  duplicates: number;
  highPriority: number;
  totalValue: number;
  potentialFees: number;
  errors: string[];
  duration: number;
}

/**
 * Progress update callback type.
 */
export interface ProgressUpdate {
  phase: 'parsing' | 'filtering' | 'scoring' | 'inserting' | 'complete';
  current: number;
  total: number;
  message: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const CONFIG = {
  // Minimum balance filter (CCP 1582 - focus on high-value leads)
  MIN_BALANCE: 10000,
  
  // Fee percentage (max 10% per CCP 1582)
  FEE_PERCENTAGE: 0.10,
  
  // Batch size for database inserts
  BATCH_SIZE: 100,
};

// ═══════════════════════════════════════════════════════════════════════════
// CSV PARSING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Parse CSV content into records.
 */
function parseCSV(content: string): RawCSVRecord[] {
  const lines = content.trim().split('\n');
  if (lines.length < 2) return [];
  
  // Parse header
  const headers = parseCSVLine(lines[0]);
  
  // Parse data rows
  const records: RawCSVRecord[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const record: RawCSVRecord = {};
    
    headers.forEach((header, idx) => {
      record[header.trim()] = values[idx]?.trim();
    });
    
    records.push(record);
  }
  
  return records;
}

/**
 * Parse a single CSV line, handling quoted fields.
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// FIELD EXTRACTION (Normalize column names)
// ═══════════════════════════════════════════════════════════════════════════

function getPropertyId(record: RawCSVRecord): string {
  return (
    record.PropertyID ||
    record.PROPERTY_ID ||
    record['Property ID'] ||
    record.RecordID ||
    ''
  ).toString().trim();
}

function getOwnerName(record: RawCSVRecord): string {
  return (
    record.OwnerName ||
    record.OWNER_NAME ||
    record['Owner Name'] ||
    record.DecedentName ||
    ''
  ).toString().trim();
}

function getAmount(record: RawCSVRecord): number {
  const raw = (
    record.CurrentBalance ||
    record.CURRENT_BALANCE ||
    record['Current Balance'] ||
    record.Amount ||
    record.CashReported ||
    '0'
  ).toString();
  
  // Remove currency symbols and commas
  const cleaned = raw.replace(/[$,\s]/g, '');
  return parseFloat(cleaned) || 0;
}

function getCounty(record: RawCSVRecord): string {
  return (
    record.County ||
    record.COUNTY ||
    'Unknown'
  ).toString().trim();
}

function getEscheatDate(record: RawCSVRecord): string | null {
  const raw = (
    record.EscheatDate ||
    record.ESCHEAT_DATE ||
    record['Escheat Date'] ||
    ''
  ).toString().trim();
  
  if (!raw) return null;
  
  // Try to parse date
  const date = new Date(raw);
  return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
}

function getDateReported(record: RawCSVRecord): string {
  const raw = (
    record.DateReported ||
    record.DATE_REPORTED ||
    record['Date Reported'] ||
    ''
  ).toString().trim();
  
  if (!raw) return new Date().toISOString().split('T')[0];
  
  const date = new Date(raw);
  return isNaN(date.getTime()) ? new Date().toISOString().split('T')[0] : date.toISOString().split('T')[0];
}

function getPropertyType(record: RawCSVRecord): string {
  return (
    record.PropertyType ||
    record.PROPERTY_TYPE ||
    record['Property Type'] ||
    'Cash'
  ).toString().trim();
}

function getHolderName(record: RawCSVRecord): string | null {
  const raw = (
    record.HolderName ||
    record.HOLDER_NAME ||
    record['Holder Name'] ||
    ''
  ).toString().trim();
  
  return raw || null;
}

function getAddress(record: RawCSVRecord): string | null {
  const raw = (
    record.Address ||
    record.ADDRESS ||
    record.LastKnownAddress ||
    record.LAST_KNOWN_ADDRESS ||
    record['Last Known Address'] ||
    ''
  ).toString().trim();
  
  return raw || null;
}

function getRelationToProperty(record: RawCSVRecord): string {
  return (
    record.RelationToProperty ||
    record.RELATION_TO_PROPERTY ||
    record['Relation To Property'] ||
    record.Relation ||
    'Unknown'
  ).toString().trim();
}

function getHeirsListed(record: RawCSVRecord): string {
  return (
    record.Heirs ||
    record.HEIRS ||
    record.HeirsListed ||
    record['Heirs Listed'] ||
    ''
  ).toString().trim();
}

/**
 * Parse heirs from CSV field.
 * Format: "John Doe (Son); Jane Doe (Daughter)" or just names
 */
function parseHeirs(heirsField: string): HeirInfo[] {
  if (!heirsField || heirsField.toLowerCase() === 'none' || heirsField === '-') {
    return [];
  }
  
  const heirs: HeirInfo[] = [];
  const parts = heirsField.split(/[;,]/).map(s => s.trim()).filter(Boolean);
  
  for (const part of parts) {
    // Try to extract name and relation: "John Doe (Son)"
    const match = part.match(/^(.+?)\s*\((.+?)\)$/);
    
    if (match) {
      heirs.push({
        name: match[1].trim(),
        relation: match[2].trim(),
        verified: false,
      });
    } else if (part.length > 0) {
      heirs.push({
        name: part.trim(),
        relation: 'Unknown',
        verified: false,
      });
    }
  }
  
  return heirs;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN INGESTION FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Process an "Estates of Deceased Persons" CSV file.
 * 
 * Steps:
 * 1. Parse CSV content
 * 2. Filter: Only records with CurrentBalance >= $10,000
 * 3. Score: Apply "Unfair Advantage" logic
 * 4. De-duplicate: Skip existing property_ids
 * 5. Insert: Bulk insert to database
 * 
 * @param csvContent - Raw CSV file content
 * @returns IngestResult with statistics
 */
export async function processEstateCSV(csvContent: string): Promise<IngestResult> {
  const startTime = Date.now();
  const batchId = `BATCH-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  
  // Auth check
  const { userId } = await auth();
  if (!userId) {
    return {
      success: false,
      batchId,
      totalRecords: 0,
      filtered: 0,
      inserted: 0,
      skipped: 0,
      duplicates: 0,
      highPriority: 0,
      totalValue: 0,
      potentialFees: 0,
      errors: ['Unauthorized - Please sign in'],
      duration: Date.now() - startTime,
    };
  }
  
  try {
    // Ensure table exists
    await createDeceasedLeadsTableFinal();
    
    // ═════════════════════════════════════════════════════════════════════
    // PHASE 1: PARSE CSV
    // ═════════════════════════════════════════════════════════════════════
    const rawRecords = parseCSV(csvContent);
    const totalRecords = rawRecords.length;
    
    if (totalRecords === 0) {
      return {
        success: false,
        batchId,
        totalRecords: 0,
        filtered: 0,
        inserted: 0,
        skipped: 0,
        duplicates: 0,
        highPriority: 0,
        totalValue: 0,
        potentialFees: 0,
        errors: ['No records found in CSV'],
        duration: Date.now() - startTime,
      };
    }
    
    // ═════════════════════════════════════════════════════════════════════
    // PHASE 2: FILTER (>= $10,000) AND TRANSFORM
    // ═════════════════════════════════════════════════════════════════════
    const leads: Omit<EstateLead, 'id' | 'created_at' | 'updated_at'>[] = [];
    let filtered = 0;
    let highPriorityCount = 0;
    let totalValue = 0;
    
    for (const record of rawRecords) {
      const amount = getAmount(record);
      
      // FILTER: Only import records >= $10,000
      if (amount < CONFIG.MIN_BALANCE) {
        filtered++;
        continue;
      }
      
      const propertyId = getPropertyId(record);
      if (!propertyId) {
        filtered++;
        continue;
      }
      
      const ownerName = getOwnerName(record);
      if (!ownerName) {
        filtered++;
        continue;
      }
      
      // Parse fields
      const relationToProperty = getRelationToProperty(record);
      const heirsListedRaw = getHeirsListed(record);
      const heirs = parseHeirs(heirsListedRaw);
      
      // ═══════════════════════════════════════════════════════════════════
      // PHASE 3: SCORE - "Unfair Advantage" Logic
      // ═══════════════════════════════════════════════════════════════════
      const { priority, reason } = scoreLead(
        relationToProperty,
        heirsListedRaw,
        heirs,
        amount
      );
      
      if (priority === 'HIGH') {
        highPriorityCount++;
      }
      
      totalValue += amount;
      
      // Build lead object
      leads.push({
        property_id: propertyId,
        owner_name: ownerName,
        amount,
        county: getCounty(record),
        escheat_date: getEscheatDate(record),
        property_type: getPropertyType(record),
        holder_name: getHolderName(record),
        last_known_address: getAddress(record),
        relation_to_property: relationToProperty,
        date_reported: getDateReported(record),
        heirs,
        heirs_listed: heirs.length > 0,
        priority,
        priority_reason: reason,
        potential_fee: amount * CONFIG.FEE_PERCENTAGE,
        status: 'NEW' as EstateLeadStatus,
        status_updated_at: null,
        notes: null,
        imported_by: userId,
        import_batch_id: batchId,
      });
    }
    
    // ═════════════════════════════════════════════════════════════════════
    // PHASE 4: INSERT WITH DE-DUPLICATION
    // ═════════════════════════════════════════════════════════════════════
    const { inserted, skipped, errors } = await bulkInsertEstateLeads(leads);
    
    // Revalidate dashboard
    revalidatePath('/admin/recovery');
    revalidatePath('/dashboard/recovery');
    
    return {
      success: true,
      batchId,
      totalRecords,
      filtered,
      inserted,
      skipped,
      duplicates: skipped,
      highPriority: highPriorityCount,
      totalValue,
      potentialFees: totalValue * CONFIG.FEE_PERCENTAGE,
      errors,
      duration: Date.now() - startTime,
    };
    
  } catch (error) {
    return {
      success: false,
      batchId,
      totalRecords: 0,
      filtered: 0,
      inserted: 0,
      skipped: 0,
      duplicates: 0,
      highPriority: 0,
      totalValue: 0,
      potentialFees: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error during ingestion'],
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Get ingestion statistics for a batch.
 */
export async function getIngestionStats(batchId?: string) {
  const { userId } = await auth();
  if (!userId) return null;
  
  try {
    if (batchId) {
      return await getImportBatchSummary(batchId);
    }
    return await getEstateLeadStats();
  } catch (error) {
    console.error('Error getting ingestion stats:', error);
    return null;
  }
}
