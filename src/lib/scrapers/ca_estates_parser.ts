/**
 * California State Controller's Office (SCO) Estates Parser
 * ==========================================================
 * 
 * Processes SCO Excel/CSV exports for deceased estate unclaimed property.
 * 
 * Data Source: https://www.sco.ca.gov/upd_download_property_records.html
 * File: "Properties $500 and up" or estate-specific exports
 * 
 * Usage:
 * 1. Download CSV from SCO website
 * 2. Call parseCAEstatesFile() with the file path or content
 * 3. Returns filtered, scored leads ready for database insertion
 */

import type { DeceasedLeadModule, ReportedHeir } from '@/lib/db';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Raw row from SCO CSV export.
 * Column names may vary - this maps common variations.
 */
export interface SCORawRecord {
  // Owner/Decedent Information
  OWNER_NAME?: string;
  DECEDENT_NAME?: string;
  PROPERTY_OWNER_NAME?: string;
  
  // Property Identification
  PROPERTY_ID?: string;
  RECORD_ID?: string;
  ACCOUNT_NUMBER?: string;
  
  // Financial
  CASH_REPORTED?: string | number;
  AVAILABLE_BALANCE?: string | number;
  REPORTED_VALUE?: string | number;
  
  // Address
  OWNER_ADDRESS?: string;
  LAST_KNOWN_ADDRESS?: string;
  STREET_ADDRESS?: string;
  CITY?: string;
  STATE?: string;
  ZIP?: string;
  
  // Property Details
  PROPERTY_TYPE?: string;
  PROPERTY_TYPE_CODE?: string;
  HOLDER_NAME?: string;
  REPORTED_HOLDER?: string;
  
  // Dates
  DATE_REPORTED?: string;
  REPORT_DATE?: string;
  DATE_OF_DEATH?: string;
  
  // Heirs (if available)
  REPORTED_HEIRS?: string;
  HEIR_NAME?: string;
  BENEFICIARY_NAME?: string;
  
  // County
  COUNTY?: string;
  COUNTY_CODE?: string;
  
  // Allow additional unknown fields
  [key: string]: string | number | undefined;
}

export interface ParsedEstateLead {
  property_id: string;
  decedent_name: string;
  available_balance: number;
  reported_heirs: ReportedHeir[];
  status: 'New';
  priority: 'High Priority - No Known Heir' | 'Standard';
  last_known_address: string | null;
  date_of_death: string | null;
  date_reported: string;
  property_type: string;
  holder_name: string | null;
  state: 'CA';
  county: string | null;
  notes: string | null;
}

export interface ParseResult {
  success: boolean;
  totalRecords: number;
  filteredRecords: number;
  highPriorityCount: number;
  leads: ParsedEstateLead[];
  errors: string[];
  skippedReasons: {
    belowThreshold: number;
    missingName: number;
    invalidData: number;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const CONFIG = {
  // Minimum balance filter (default $10,000)
  MIN_BALANCE: 10000,
  
  // Keywords indicating estate/deceased records
  ESTATE_KEYWORDS: [
    'ESTATE',
    'DECEASED',
    'DECEDENT',
    'TRUST',
    'SUCCESSOR',
    'HEIR',
    'BENEFICIARY',
    'PROBATE',
    'EXECUTOR',
    'ADMINISTRATOR',
  ],
  
  // Property types likely to be estates
  ESTATE_PROPERTY_TYPES: [
    'CK', // Checking
    'SV', // Savings
    'SC', // Securities
    'IN', // Insurance
    'SD', // Safe Deposit
    'MI', // Miscellaneous
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// PARSER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Parse CSV content string into array of records.
 */
export function parseCSVContent(csvContent: string): SCORawRecord[] {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) {
    return [];
  }
  
  // Parse header row
  const headers = parseCSVLine(lines[0]);
  
  // Parse data rows
  const records: SCORawRecord[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const record: SCORawRecord = {};
    
    headers.forEach((header, idx) => {
      const normalizedHeader = normalizeColumnName(header);
      record[normalizedHeader] = values[idx]?.trim() || undefined;
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
        i++; // Skip escaped quote
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

/**
 * Normalize column names to our expected format.
 */
function normalizeColumnName(name: string): string {
  return name
    .toUpperCase()
    .trim()
    .replace(/[^A-Z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Extract dollar amount from string.
 */
function extractAmount(value: string | number | undefined): number {
  if (value === undefined || value === null) return 0;
  if (typeof value === 'number') return value;
  
  // Remove currency symbols, commas, and whitespace
  const cleaned = value.replace(/[$,\s]/g, '');
  const parsed = parseFloat(cleaned);
  
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Check if record appears to be an estate/deceased property.
 */
function isEstateRecord(record: SCORawRecord): boolean {
  const ownerName = getOwnerName(record).toUpperCase();
  
  // Check for estate keywords in owner name
  return CONFIG.ESTATE_KEYWORDS.some(keyword => ownerName.includes(keyword));
}

/**
 * Get the owner/decedent name from various possible column names.
 */
function getOwnerName(record: SCORawRecord): string {
  return (
    record.DECEDENT_NAME ||
    record.OWNER_NAME ||
    record.PROPERTY_OWNER_NAME ||
    ''
  ).trim();
}

/**
 * Get the available balance from various possible column names.
 */
function getBalance(record: SCORawRecord): number {
  return extractAmount(
    record.AVAILABLE_BALANCE ||
    record.CASH_REPORTED ||
    record.REPORTED_VALUE
  );
}

/**
 * Get the property ID from various possible column names.
 */
function getPropertyId(record: SCORawRecord): string {
  return (
    record.PROPERTY_ID ||
    record.RECORD_ID ||
    record.ACCOUNT_NUMBER ||
    `CA-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  ).trim();
}

/**
 * Parse reported heirs from CSV field.
 * Format varies: "John Doe (Son); Jane Doe (Daughter)" or just names
 */
function parseReportedHeirs(heirsField: string | undefined): ReportedHeir[] {
  if (!heirsField || heirsField.trim() === '') {
    return [];
  }
  
  const heirs: ReportedHeir[] = [];
  
  // Split by semicolon or comma
  const parts = heirsField.split(/[;,]/).map(s => s.trim()).filter(Boolean);
  
  for (const part of parts) {
    // Try to extract name and relation: "John Doe (Son)"
    const match = part.match(/^(.+?)\s*\((.+?)\)$/);
    
    if (match) {
      heirs.push({
        name: match[1].trim(),
        relation: match[2].trim(),
        confidence: 80,
        source: 'SCO Database',
      });
    } else {
      // Just a name without relation
      heirs.push({
        name: part.trim(),
        relation: 'Unknown',
        confidence: 60,
        source: 'SCO Database',
      });
    }
  }
  
  return heirs;
}

/**
 * Build full address from components.
 */
function buildAddress(record: SCORawRecord): string | null {
  const address = record.LAST_KNOWN_ADDRESS || record.OWNER_ADDRESS || record.STREET_ADDRESS;
  const city = record.CITY;
  const state = record.STATE || 'CA';
  const zip = record.ZIP;
  
  if (!address && !city) return null;
  
  const parts = [address, city, state, zip].filter(Boolean);
  return parts.join(', ') || null;
}

/**
 * Main parsing function - processes SCO CSV content.
 */
export function parseCAEstatesFile(
  csvContent: string,
  options?: {
    minBalance?: number;
    estatesOnly?: boolean;
  }
): ParseResult {
  const minBalance = options?.minBalance ?? CONFIG.MIN_BALANCE;
  const estatesOnly = options?.estatesOnly ?? true;
  
  const errors: string[] = [];
  const leads: ParsedEstateLead[] = [];
  const skippedReasons = {
    belowThreshold: 0,
    missingName: 0,
    invalidData: 0,
  };
  
  let highPriorityCount = 0;
  
  try {
    const records = parseCSVContent(csvContent);
    
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      
      try {
        // Get owner name
        const decedentName = getOwnerName(record);
        if (!decedentName) {
          skippedReasons.missingName++;
          continue;
        }
        
        // Check if estate record (if filter enabled)
        if (estatesOnly && !isEstateRecord(record)) {
          continue;
        }
        
        // Get balance and apply filter
        const balance = getBalance(record);
        if (balance < minBalance) {
          skippedReasons.belowThreshold++;
          continue;
        }
        
        // Parse heirs
        const reportedHeirs = parseReportedHeirs(
          record.REPORTED_HEIRS || record.HEIR_NAME || record.BENEFICIARY_NAME
        );
        
        // Determine priority
        const isHighPriority = reportedHeirs.length === 0;
        if (isHighPriority) {
          highPriorityCount++;
        }
        
        // Build lead object
        const lead: ParsedEstateLead = {
          property_id: getPropertyId(record),
          decedent_name: decedentName,
          available_balance: balance,
          reported_heirs: reportedHeirs,
          status: 'New',
          priority: isHighPriority ? 'High Priority - No Known Heir' : 'Standard',
          last_known_address: buildAddress(record),
          date_of_death: record.DATE_OF_DEATH || null,
          date_reported: record.DATE_REPORTED || record.REPORT_DATE || new Date().toISOString().split('T')[0],
          property_type: record.PROPERTY_TYPE || record.PROPERTY_TYPE_CODE || 'Cash',
          holder_name: record.HOLDER_NAME || record.REPORTED_HOLDER || null,
          state: 'CA',
          county: record.COUNTY || null,
          notes: isHighPriority ? 'High Priority - No Known Heir on file' : null,
        };
        
        leads.push(lead);
        
      } catch (recordError) {
        skippedReasons.invalidData++;
        errors.push(`Row ${i + 2}: ${recordError instanceof Error ? recordError.message : 'Invalid data'}`);
      }
    }
    
    // Sort by balance descending
    leads.sort((a, b) => b.available_balance - a.available_balance);
    
    return {
      success: true,
      totalRecords: records.length,
      filteredRecords: leads.length,
      highPriorityCount,
      leads,
      errors,
      skippedReasons,
    };
    
  } catch (error) {
    return {
      success: false,
      totalRecords: 0,
      filteredRecords: 0,
      highPriorityCount: 0,
      leads: [],
      errors: [error instanceof Error ? error.message : 'Failed to parse CSV'],
      skippedReasons,
    };
  }
}

/**
 * Convert parsed leads to database format.
 */
export function toDeceasedLeadModules(
  leads: ParsedEstateLead[]
): Omit<DeceasedLeadModule, 'id' | 'created_at' | 'updated_at'>[] {
  return leads.map(lead => ({
    property_id: lead.property_id,
    decedent_name: lead.decedent_name,
    available_balance: lead.available_balance,
    reported_heirs: lead.reported_heirs,
    status: lead.status,
    last_known_address: lead.last_known_address,
    date_of_death: lead.date_of_death,
    date_reported: lead.date_reported,
    property_type: lead.property_type,
    holder_name: lead.holder_name,
    state: lead.state,
    county: lead.county,
    notes: lead.notes,
  }));
}

// ═══════════════════════════════════════════════════════════════════════════
// EXCEL PARSING (XLSX) - Optional
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Parse Excel file using SheetJS (xlsx library).
 * 
 * IMPORTANT: This function requires the 'xlsx' package to be installed:
 * npm install xlsx
 * 
 * Usage:
 * 1. Install xlsx: npm install xlsx
 * 2. Convert Excel to CSV first, then use parseCAEstatesFile()
 * 
 * Example:
 * ```typescript
 * import * as XLSX from 'xlsx';
 * 
 * const file = event.target.files[0];
 * const buffer = await file.arrayBuffer();
 * const workbook = XLSX.read(buffer, { type: 'array' });
 * const csvContent = XLSX.utils.sheet_to_csv(workbook.Sheets[workbook.SheetNames[0]]);
 * const result = parseCAEstatesFile(csvContent);
 * ```
 * 
 * Note: We don't include xlsx as a dependency to keep the bundle size small.
 * If you need Excel support, install it manually.
 */
export function excelParsingInstructions(): string {
  return `
To parse Excel files, install xlsx: npm install xlsx

Then use:
  import * as XLSX from 'xlsx';
  const workbook = XLSX.read(fileBuffer, { type: 'array' });
  const csvContent = XLSX.utils.sheet_to_csv(workbook.Sheets[workbook.SheetNames[0]]);
  const result = parseCAEstatesFile(csvContent);
`;
}

// ═══════════════════════════════════════════════════════════════════════════
// SUMMARY REPORT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate a summary report of parsed data.
 */
export function generateParseReport(result: ParseResult): string {
  const lines = [
    '═══════════════════════════════════════════════════════════',
    '          CA ESTATES PARSER - IMPORT SUMMARY',
    '═══════════════════════════════════════════════════════════',
    '',
    `Status: ${result.success ? '✓ SUCCESS' : '✗ FAILED'}`,
    '',
    '── Records ──────────────────────────────────────────────────',
    `Total in file:        ${result.totalRecords.toLocaleString()}`,
    `Imported:             ${result.filteredRecords.toLocaleString()}`,
    `High Priority:        ${result.highPriorityCount.toLocaleString()} (No Known Heir)`,
    '',
    '── Skipped ──────────────────────────────────────────────────',
    `Below $10k threshold: ${result.skippedReasons.belowThreshold.toLocaleString()}`,
    `Missing owner name:   ${result.skippedReasons.missingName.toLocaleString()}`,
    `Invalid data:         ${result.skippedReasons.invalidData.toLocaleString()}`,
    '',
  ];
  
  if (result.leads.length > 0) {
    const totalValue = result.leads.reduce((sum, l) => sum + l.available_balance, 0);
    const totalFees = totalValue * 0.10;
    
    lines.push(
      '── Financial Summary ────────────────────────────────────────',
      `Total Value:          $${totalValue.toLocaleString()}`,
      `Potential Fees (10%): $${totalFees.toLocaleString()}`,
      '',
      '── Top 5 Leads ──────────────────────────────────────────────'
    );
    
    result.leads.slice(0, 5).forEach((lead, i) => {
      lines.push(
        `${i + 1}. ${lead.decedent_name}`,
        `   $${lead.available_balance.toLocaleString()} | ${lead.county || 'Unknown County'} | ${lead.priority}`
      );
    });
  }
  
  if (result.errors.length > 0) {
    lines.push(
      '',
      '── Errors ───────────────────────────────────────────────────',
      ...result.errors.slice(0, 10)
    );
    
    if (result.errors.length > 10) {
      lines.push(`... and ${result.errors.length - 10} more errors`);
    }
  }
  
  lines.push(
    '',
    '═══════════════════════════════════════════════════════════'
  );
  
  return lines.join('\n');
}
