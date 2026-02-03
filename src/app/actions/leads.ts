'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import {
  DeceasedLead,
  DeceasedLeadStatus,
  PotentialHeir,
  getDeceasedLeads,
  saveDeceasedLead,
  updateDeceasedLeadStatus,
  updateDeceasedLeadHeirs,
  bulkInsertDeceasedLeads,
  createDeceasedLeadsTable,
  getDeceasedLeadStats,
} from '@/lib/db';
import {
  Lead,
  ScraperConfig,
  scrapeUnclaimedProperty,
  searchRelatives as searchRelativesAPI,
  RelativeSearchResult,
} from '@/lib/scrapers/unclaimed-property';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface ScrapeResult {
  success: boolean;
  leadsFound: number;
  leadsInserted: number;
  errors: string[];
}

export interface HeirSearchResult {
  success: boolean;
  heirs: PotentialHeir[];
  searchSource: string;
  error?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// SERVER ACTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Scrape and sync deceased leads from state controller databases.
 * 
 * PLACEHOLDER: Insert your scraping logic here.
 * 
 * Potential sources:
 * - California: https://www.sco.ca.gov/upd_msg.html (Estates)
 * - Texas: https://claimittexas.gov/
 * - Florida: https://fltreasurehunt.gov/
 * 
 * @param source - The data source to scrape ('california' | 'texas' | 'florida' | 'all')
 * @returns ScrapeResult with counts and errors
 */
export async function scrapeAndSyncLeads(source: string = 'california'): Promise<ScrapeResult> {
  const { userId } = await auth();
  
  if (!userId) {
    return {
      success: false,
      leadsFound: 0,
      leadsInserted: 0,
      errors: ['Unauthorized - Please sign in'],
    };
  }

  try {
    // Ensure table exists
    await createDeceasedLeadsTable();
    
    // ═══════════════════════════════════════════════════════════════════════
    // PLACEHOLDER: Insert your scraping logic here
    // ═══════════════════════════════════════════════════════════════════════
    // 
    // Example structure for scraped data:
    // const scrapedLeads = await scrapeCaliforniaEstates();
    // 
    // For now, we return sample data for development/testing:
    
    const sampleLeads: Omit<DeceasedLead, 'id' | 'created_at' | 'updated_at'>[] = [
      {
        original_owner: 'JOHN DOE ESTATE',
        asset_amount: 45000,
        potential_fee: 4500,
        source_url: 'https://www.sco.ca.gov/upd_msg.html',
        date_listed: new Date().toISOString().split('T')[0],
        status: 'new',
        potential_heirs: [],
        county: 'Sacramento',
        state: 'CA',
        property_type: 'Cash',
        notes: 'Sample lead - replace with real scraping logic',
      },
      {
        original_owner: 'MARY SMITH ESTATE',
        asset_amount: 125000,
        potential_fee: 12500,
        source_url: 'https://www.sco.ca.gov/upd_msg.html',
        date_listed: new Date().toISOString().split('T')[0],
        status: 'new',
        potential_heirs: [],
        county: 'San Francisco',
        state: 'CA',
        property_type: 'Securities',
        notes: 'Sample lead - replace with real scraping logic',
      },
      {
        original_owner: 'ROBERT JOHNSON ESTATE',
        asset_amount: 78500,
        potential_fee: 7850,
        source_url: 'https://www.sco.ca.gov/upd_msg.html',
        date_listed: new Date().toISOString().split('T')[0],
        status: 'new',
        potential_heirs: [],
        county: 'Los Angeles',
        state: 'CA',
        property_type: 'Safe Deposit',
        notes: 'Sample lead - replace with real scraping logic',
      },
    ];

    // Insert sample leads (in production, replace with real scraped data)
    const inserted = await bulkInsertDeceasedLeads(sampleLeads);
    
    // Revalidate the deceased leads page
    revalidatePath('/admin/recovery/deceased-leads');
    
    return {
      success: true,
      leadsFound: sampleLeads.length,
      leadsInserted: inserted,
      errors: [],
    };
    
    // ═══════════════════════════════════════════════════════════════════════
    // END PLACEHOLDER
    // ═══════════════════════════════════════════════════════════════════════

  } catch (error) {
    console.error('Error scraping leads:', error);
    return {
      success: false,
      leadsFound: 0,
      leadsInserted: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error occurred'],
    };
  }
}

/**
 * Search for potential heirs of a deceased person.
 * 
 * PLACEHOLDER: Insert your heir search logic here.
 * 
 * Potential APIs/Services:
 * - BeenVerified API
 * - TruePeopleSearch scraping
 * - Ancestry.com API
 * - PeopleSearch APIs
 * 
 * @param leadId - The ID of the deceased lead
 * @param originalOwner - The name of the deceased owner
 * @returns HeirSearchResult with found heirs
 */
export async function searchRelatives(
  leadId: string,
  originalOwner: string
): Promise<HeirSearchResult> {
  const { userId } = await auth();
  
  if (!userId) {
    return {
      success: false,
      heirs: [],
      searchSource: '',
      error: 'Unauthorized - Please sign in',
    };
  }

  try {
    // ═══════════════════════════════════════════════════════════════════════
    // PLACEHOLDER: Insert your heir search logic here
    // ═══════════════════════════════════════════════════════════════════════
    // 
    // Example:
    // const heirs = await searchBeenVerified(originalOwner);
    // const heirs = await searchAncestry(originalOwner);
    // 
    // For now, return placeholder data:
    
    const placeholderHeirs: PotentialHeir[] = [
      {
        name: `${originalOwner.split(' ')[0]} Jr.`,
        relation: 'Child',
        contact_info: 'Pending research - use BeenVerified or similar',
      },
      {
        name: `Sarah ${originalOwner.split(' ').pop()}`,
        relation: 'Spouse',
        contact_info: 'Pending research',
      },
    ];

    // Update the lead with found heirs
    await updateDeceasedLeadHeirs(leadId, placeholderHeirs);
    
    // Revalidate
    revalidatePath('/admin/recovery/deceased-leads');
    
    return {
      success: true,
      heirs: placeholderHeirs,
      searchSource: 'Placeholder - Implement real search API',
    };
    
    // ═══════════════════════════════════════════════════════════════════════
    // END PLACEHOLDER
    // ═══════════════════════════════════════════════════════════════════════

  } catch (error) {
    console.error('Error searching relatives:', error);
    return {
      success: false,
      heirs: [],
      searchSource: '',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Update the status of a deceased lead.
 */
export async function updateLeadStatus(
  leadId: string,
  status: DeceasedLeadStatus
): Promise<{ success: boolean; error?: string }> {
  const { userId } = await auth();
  
  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    await updateDeceasedLeadStatus(leadId, status);
    revalidatePath('/admin/recovery/deceased-leads');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update status',
    };
  }
}

/**
 * Fetch deceased leads with filters.
 */
export async function fetchDeceasedLeads(filters?: {
  status?: DeceasedLeadStatus;
  state?: string;
  minAmount?: number;
}): Promise<DeceasedLead[]> {
  const { userId } = await auth();
  
  if (!userId) {
    return [];
  }

  try {
    return await getDeceasedLeads(filters);
  } catch (error) {
    console.error('Error fetching deceased leads:', error);
    return [];
  }
}

/**
 * Get statistics for deceased leads.
 */
export async function fetchDeceasedLeadStats() {
  const { userId } = await auth();
  
  if (!userId) {
    return null;
  }

  try {
    return await getDeceasedLeadStats();
  } catch (error) {
    console.error('Error fetching stats:', error);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SCRAPER INFRASTRUCTURE ACTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Search for relatives of an owner using enrichment APIs.
 * This is the "unfair advantage" - automated heir finding.
 * 
 * Uses: PeopleDataLabs, BeenVerified, or similar APIs
 * 
 * @param ownerName - The deceased owner's name
 * @param lastKnownAddress - Last known address (improves accuracy)
 * @returns RelativeSearchResult with found relatives
 */
export async function searchRelativesAction(
  ownerName: string,
  lastKnownAddress?: string | null
): Promise<RelativeSearchResult> {
  const { userId } = await auth();
  
  if (!userId) {
    return {
      success: false,
      relatives: [],
      source: '',
      error: 'Unauthorized - Please sign in',
    };
  }

  try {
    // Call the scraper infrastructure's searchRelatives function
    const result = await searchRelativesAPI(ownerName, lastKnownAddress);
    
    // Revalidate relevant pages
    revalidatePath('/dashboard/recovery/leads');
    revalidatePath('/admin/recovery/deceased-leads');
    
    return result;
    
  } catch (error) {
    console.error('Error in searchRelativesAction:', error);
    return {
      success: false,
      relatives: [],
      source: '',
      error: error instanceof Error ? error.message : 'Search failed',
    };
  }
}

/**
 * Run the scraper to fetch new leads from state databases.
 * 
 * @param states - Array of state codes to scrape
 * @param minValue - Minimum asset value to include
 * @returns Scraper result with found leads
 */
export async function runScraperAction(
  states: ('CA' | 'TX' | 'FL')[],
  minValue: number = 5000
): Promise<{
  success: boolean;
  leadsFound: number;
  errors: string[];
}> {
  const { userId } = await auth();
  
  if (!userId) {
    return {
      success: false,
      leadsFound: 0,
      errors: ['Unauthorized'],
    };
  }

  try {
    const result = await scrapeUnclaimedProperty(states, {
      minValue,
      maxResults: 100,
      delayMs: 2000, // 2 second delay between states
    });
    
    // If leads were found, convert and save to database
    if (result.leads.length > 0) {
      const deceasedLeads = result.leads.map(lead => ({
        original_owner: lead.ownerName,
        asset_amount: lead.assetValue,
        potential_fee: lead.assetValue * 0.10,
        source_url: lead.sourceUrl,
        date_listed: lead.dateReported,
        status: 'new' as const,
        potential_heirs: [],
        county: lead.county,
        state: lead.state,
        property_type: lead.propertyType,
        notes: `Scraped from ${lead.state} database`,
      }));
      
      await bulkInsertDeceasedLeads(deceasedLeads);
    }
    
    revalidatePath('/dashboard/recovery/leads');
    revalidatePath('/admin/recovery/deceased-leads');
    
    return {
      success: result.success,
      leadsFound: result.totalFound,
      errors: result.errors,
    };
    
  } catch (error) {
    console.error('Error running scraper:', error);
    return {
      success: false,
      leadsFound: 0,
      errors: [error instanceof Error ? error.message : 'Scraper failed'],
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// LEAD TYPES FOR DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════

export type { Lead, RelativeSearchResult } from '@/lib/scrapers/unclaimed-property';
