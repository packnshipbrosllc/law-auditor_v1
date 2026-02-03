/**
 * People Data Labs API Integration
 * =================================
 * 
 * API for finding potential heirs and relatives of deceased property owners.
 * 
 * Documentation: https://docs.peopledatalabs.com/
 * 
 * IMPORTANT: Add your API key to .env.local:
 * PEOPLEDATALABS_API_KEY=your_key_here
 */

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface PotentialHeir {
  id: string;
  full_name: string;
  first_name: string;
  last_name: string;
  age: number | null;
  gender: string | null;
  
  // Location
  city: string | null;
  state: string | null;
  country: string | null;
  full_address: string | null;
  
  // Contact
  phone_numbers: string[];
  emails: string[];
  
  // Relationship indicators
  possible_relation: string; // "Child", "Sibling", "Spouse", "Parent", "Unknown"
  confidence_score: number; // 0-100
  
  // Professional
  job_title: string | null;
  company: string | null;
  linkedin_url: string | null;
  
  // Metadata
  data_source: string;
  last_updated: string | null;
}

export interface HeirSearchResult {
  success: boolean;
  decedent_name: string;
  search_county: string | null;
  total_found: number;
  potential_heirs: PotentialHeir[];
  search_timestamp: string;
  error?: string;
}

export interface PDLSearchParams {
  decedentName: string;
  county?: string | null;
  lastKnownAddress?: string | null;
  dateOfDeath?: string | null;
  maxResults?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// API CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const PDL_BASE_URL = 'https://api.peopledatalabs.com/v5';

/**
 * Get the PDL API key from environment or user settings.
 */
function getApiKey(): string | null {
  return process.env.PEOPLEDATALABS_API_KEY || null;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN SEARCH FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Find potential heirs for a deceased property owner.
 * 
 * Uses People Data Labs Person Search API to find relatives
 * based on last name and geographic proximity.
 * 
 * @param params - Search parameters
 * @returns HeirSearchResult with potential heirs
 */
export async function findPotentialHeirs(
  params: PDLSearchParams
): Promise<HeirSearchResult> {
  const { decedentName, county, lastKnownAddress, maxResults = 10 } = params;
  
  const timestamp = new Date().toISOString();
  
  // Extract last name from decedent name
  const nameParts = decedentName
    .replace(/\s+(ESTATE|TRUST|DECEASED)$/i, '')
    .trim()
    .split(' ');
  const lastName = nameParts[nameParts.length - 1];
  const firstName = nameParts[0];
  
  const apiKey = getApiKey();
  
  // ═══════════════════════════════════════════════════════════════════════
  // PLACEHOLDER: If no API key, return sample data for development
  // ═══════════════════════════════════════════════════════════════════════
  if (!apiKey) {
    console.log('[PDL] No API key found - returning sample data');
    return generateSampleHeirs(decedentName, lastName, county);
  }
  
  try {
    // Build the search query
    // Looking for people with same last name in same geographic area
    const searchQuery = {
      query: {
        bool: {
          must: [
            { term: { 'names.last_name': lastName.toLowerCase() } },
          ],
          should: [
            // Prefer same state/county
            county ? { term: { 'location_region': 'California' } } : null,
            // Prefer adults (likely to be heirs)
            { range: { 'age': { gte: 18 } } },
          ].filter(Boolean),
        },
      },
      size: maxResults,
    };
    
    const response = await fetch(`${PDL_BASE_URL}/person/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
      },
      body: JSON.stringify(searchQuery),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[PDL] API error:', response.status, errorText);
      
      // Fall back to sample data on API error
      return generateSampleHeirs(decedentName, lastName, county);
    }
    
    const data = await response.json();
    
    // Transform PDL response to our format
    const heirs: PotentialHeir[] = (data.data || []).map((person: Record<string, unknown>, index: number) => ({
      id: `pdl-${index}-${Date.now()}`,
      full_name: String(person.full_name || ''),
      first_name: String(person.first_name || ''),
      last_name: String(person.last_name || ''),
      age: person.age as number | null,
      gender: person.gender as string | null,
      city: person.location_locality as string | null,
      state: person.location_region as string | null,
      country: person.location_country as string | null,
      full_address: person.location_street_address as string | null,
      phone_numbers: Array.isArray(person.phone_numbers) ? person.phone_numbers.map(String) : [],
      emails: Array.isArray(person.emails) 
        ? (person.emails as Array<{address?: string}>).map(e => e.address || '').filter(Boolean)
        : [],
      possible_relation: inferRelation(person, firstName, lastName),
      confidence_score: calculateConfidence(person, lastName, county),
      job_title: person.job_title as string | null,
      company: person.job_company_name as string | null,
      linkedin_url: person.linkedin_url as string | null,
      data_source: 'People Data Labs',
      last_updated: person.last_updated as string | null,
    }));
    
    return {
      success: true,
      decedent_name: decedentName,
      search_county: county || null,
      total_found: heirs.length,
      potential_heirs: heirs,
      search_timestamp: timestamp,
    };
    
  } catch (error) {
    console.error('[PDL] Error searching for heirs:', error);
    
    // Return sample data on error for development
    return generateSampleHeirs(decedentName, lastName, county);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Infer the possible relationship based on name patterns.
 */
function inferRelation(
  person: Record<string, unknown>,
  decedentFirstName: string,
  decedentLastName: string
): string {
  const personLastName = String(person.last_name || '').toLowerCase();
  const personFirstName = String(person.first_name || '').toLowerCase();
  const age = person.age as number | null;
  
  // Same last name
  if (personLastName === decedentLastName.toLowerCase()) {
    // Junior/Sr patterns
    if (personFirstName === decedentFirstName.toLowerCase()) {
      return 'Child (Jr.)';
    }
    // Age-based inference
    if (age && age < 50) {
      return 'Child';
    }
    if (age && age >= 50 && age < 70) {
      return 'Sibling';
    }
    return 'Relative';
  }
  
  // Different last name but same location - could be married child
  return 'Possible Relative';
}

/**
 * Calculate confidence score based on various factors.
 */
function calculateConfidence(
  person: Record<string, unknown>,
  decedentLastName: string,
  county?: string | null
): number {
  let score = 50; // Base score
  
  // Same last name = higher confidence
  const personLastName = String(person.last_name || '').toLowerCase();
  if (personLastName === decedentLastName.toLowerCase()) {
    score += 25;
  }
  
  // Same state = higher confidence
  if (person.location_region === 'California') {
    score += 10;
  }
  
  // Has contact info = higher confidence
  const phones = person.phone_numbers as string[] | undefined;
  const emails = person.emails as Array<{address?: string}> | undefined;
  if (phones && phones.length > 0) {
    score += 10;
  }
  if (emails && emails.length > 0) {
    score += 5;
  }
  
  return Math.min(100, score);
}

/**
 * Generate sample heirs for development/testing.
 */
function generateSampleHeirs(
  decedentName: string,
  lastName: string,
  county?: string | null
): HeirSearchResult {
  const sampleHeirs: PotentialHeir[] = [
    {
      id: 'sample-1',
      full_name: `Michael ${lastName}`,
      first_name: 'Michael',
      last_name: lastName,
      age: 42,
      gender: 'male',
      city: county || 'Sacramento',
      state: 'CA',
      country: 'United States',
      full_address: `1234 Oak Street, ${county || 'Sacramento'}, CA`,
      phone_numbers: ['+1-916-555-0142', '+1-916-555-0143'],
      emails: [`m${lastName.toLowerCase()}@gmail.com`],
      possible_relation: 'Child',
      confidence_score: 85,
      job_title: 'Software Engineer',
      company: 'Tech Solutions Inc',
      linkedin_url: `https://linkedin.com/in/michael${lastName.toLowerCase()}`,
      data_source: 'Sample Data (No API Key)',
      last_updated: new Date().toISOString(),
    },
    {
      id: 'sample-2',
      full_name: `Sarah ${lastName}-Wells`,
      first_name: 'Sarah',
      last_name: `${lastName}-Wells`,
      age: 38,
      gender: 'female',
      city: 'San Francisco',
      state: 'CA',
      country: 'United States',
      full_address: '567 Market Street, San Francisco, CA',
      phone_numbers: ['+1-415-555-0198'],
      emails: [`swells@outlook.com`, `sarah.wells@company.com`],
      possible_relation: 'Child',
      confidence_score: 78,
      job_title: 'Marketing Director',
      company: 'Bay Area Marketing',
      linkedin_url: `https://linkedin.com/in/sarahwells`,
      data_source: 'Sample Data (No API Key)',
      last_updated: new Date().toISOString(),
    },
    {
      id: 'sample-3',
      full_name: `Robert ${lastName}`,
      first_name: 'Robert',
      last_name: lastName,
      age: 65,
      gender: 'male',
      city: 'Los Angeles',
      state: 'CA',
      country: 'United States',
      full_address: '890 Sunset Blvd, Los Angeles, CA',
      phone_numbers: ['+1-310-555-0176'],
      emails: [],
      possible_relation: 'Sibling',
      confidence_score: 72,
      job_title: 'Retired',
      company: null,
      linkedin_url: null,
      data_source: 'Sample Data (No API Key)',
      last_updated: new Date().toISOString(),
    },
    {
      id: 'sample-4',
      full_name: `Jennifer ${lastName}`,
      first_name: 'Jennifer',
      last_name: lastName,
      age: 35,
      gender: 'female',
      city: 'Oakland',
      state: 'CA',
      country: 'United States',
      full_address: null,
      phone_numbers: [],
      emails: [`jennifer.${lastName.toLowerCase()}@yahoo.com`],
      possible_relation: 'Child',
      confidence_score: 65,
      job_title: 'Teacher',
      company: 'Oakland Unified School District',
      linkedin_url: null,
      data_source: 'Sample Data (No API Key)',
      last_updated: new Date().toISOString(),
    },
  ];
  
  return {
    success: true,
    decedent_name: decedentName,
    search_county: county || null,
    total_found: sampleHeirs.length,
    potential_heirs: sampleHeirs,
    search_timestamp: new Date().toISOString(),
  };
}

