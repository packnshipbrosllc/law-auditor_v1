/**
 * Waterfall Enrichment Service
 * =============================
 * 
 * Dual-API architecture for heir contact enrichment.
 * Tries Apollo first, falls back to People Data Labs.
 * 
 * This approach maximizes hit rate while tracking ROI per provider.
 * 
 * Required environment variables:
 * - APOLLO_API_KEY
 * - PEOPLEDATALABS_API_KEY
 */

// ═══════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Unified contact information returned by any enrichment provider.
 */
export interface ContactInfo {
  // Identity
  full_name: string;
  first_name: string | null;
  last_name: string | null;
  age: number | null;
  
  // Contact Details (The Money Fields)
  mobile_phone: string | null;
  work_phone: string | null;
  verified_email: string | null;
  personal_email: string | null;
  
  // Location
  city: string | null;
  state: string | null;
  full_address: string | null;
  
  // Professional
  job_title: string | null;
  company: string | null;
  linkedin_url: string | null;
  
  // Metadata
  confidence_score: number;
  source: EnrichmentSource;
  enriched_at: string;
  
  // Raw data for debugging
  raw_response?: Record<string, unknown>;
}

export type EnrichmentSource = 'Apollo' | 'PeopleDataLabs' | 'Manual' | 'None';

export type EnrichmentStatus = 
  | 'Enriched'           // Successfully found contact info
  | 'Partial'            // Found some info but missing phone/email
  | 'Not Found'          // No match found
  | 'Manual Required'    // API error or credits exhausted
  | 'Pending';           // Not yet processed

/**
 * Result of an enrichment attempt.
 */
export interface EnrichmentResult {
  success: boolean;
  status: EnrichmentStatus;
  contact: ContactInfo | null;
  source: EnrichmentSource;
  errors: string[];
  
  // Cost tracking
  api_calls_made: number;
  apis_attempted: EnrichmentSource[];
}

/**
 * Common interface for all enrichment providers.
 * Allows easy swapping between Apollo, PDL, or future providers.
 */
export interface EnrichmentProvider {
  name: EnrichmentSource;
  
  /**
   * Search for a person by name and optional filters.
   */
  searchPerson(params: PersonSearchParams): Promise<ContactInfo | null>;
  
  /**
   * Check if the provider is available (has API key, credits, etc.)
   */
  isAvailable(): boolean;
}

export interface PersonSearchParams {
  // Required
  full_name: string;
  
  // Optional filters to improve accuracy
  last_name?: string;
  county?: string;
  state?: string;
  city?: string;
  
  // For heir searches
  decedent_name?: string;
  possible_relation?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// APOLLO.IO PROVIDER
// ═══════════════════════════════════════════════════════════════════════════

class ApolloProvider implements EnrichmentProvider {
  name: EnrichmentSource = 'Apollo';
  private apiKey: string | null;
  
  constructor() {
    this.apiKey = process.env.APOLLO_API_KEY || null;
  }
  
  isAvailable(): boolean {
    return !!this.apiKey;
  }
  
  async searchPerson(params: PersonSearchParams): Promise<ContactInfo | null> {
    if (!this.apiKey) {
      console.log('[Apollo] No API key configured');
      return null;
    }
    
    try {
      // Apollo People Match endpoint
      const response = await fetch('https://api.apollo.io/v1/people/match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({
          api_key: this.apiKey,
          first_name: params.full_name.split(' ')[0],
          last_name: params.last_name || params.full_name.split(' ').slice(-1)[0],
          state: params.state || 'California',
          city: params.city,
        }),
      });
      
      if (!response.ok) {
        console.error('[Apollo] API error:', response.status);
        return null;
      }
      
      const data = await response.json();
      const person = data.person;
      
      if (!person) {
        console.log('[Apollo] No match found for:', params.full_name);
        return null;
      }
      
      // Extract phone numbers
      const phones = person.phone_numbers || [];
      const mobilePhone = phones.find((p: { type?: string }) => p.type === 'mobile')?.sanitized_number;
      const workPhone = phones.find((p: { type?: string }) => p.type === 'work')?.sanitized_number;
      
      return {
        full_name: person.name || params.full_name,
        first_name: person.first_name,
        last_name: person.last_name,
        age: null, // Apollo doesn't provide age
        mobile_phone: mobilePhone || phones[0]?.sanitized_number || null,
        work_phone: workPhone || null,
        verified_email: person.email,
        personal_email: person.personal_emails?.[0] || null,
        city: person.city,
        state: person.state,
        full_address: [person.street_address, person.city, person.state].filter(Boolean).join(', ') || null,
        job_title: person.title,
        company: person.organization?.name,
        linkedin_url: person.linkedin_url,
        confidence_score: person.email_status === 'verified' ? 90 : 70,
        source: 'Apollo',
        enriched_at: new Date().toISOString(),
        raw_response: person,
      };
      
    } catch (error) {
      console.error('[Apollo] Error:', error);
      return null;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PEOPLE DATA LABS PROVIDER
// ═══════════════════════════════════════════════════════════════════════════

class PeopleDataLabsProvider implements EnrichmentProvider {
  name: EnrichmentSource = 'PeopleDataLabs';
  private apiKey: string | null;
  
  constructor() {
    this.apiKey = process.env.PEOPLEDATALABS_API_KEY || null;
  }
  
  isAvailable(): boolean {
    return !!this.apiKey;
  }
  
  async searchPerson(params: PersonSearchParams): Promise<ContactInfo | null> {
    if (!this.apiKey) {
      console.log('[PDL] No API key configured');
      return null;
    }
    
    try {
      // PDL Person Enrichment endpoint
      const queryParams = new URLSearchParams({
        api_key: this.apiKey,
        name: params.full_name,
        ...(params.state && { region: params.state }),
        ...(params.city && { locality: params.city }),
      });
      
      const response = await fetch(
        `https://api.peopledatalabs.com/v5/person/enrich?${queryParams}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        console.error('[PDL] API error:', response.status);
        return null;
      }
      
      const data = await response.json();
      
      if (data.status !== 200 || !data.data) {
        console.log('[PDL] No match found for:', params.full_name);
        return null;
      }
      
      const person = data.data;
      
      // Extract phones
      const phones = person.phone_numbers || [];
      const mobilePhone = phones.find((p: string) => p.startsWith('+1'))?.replace(/\D/g, '') || phones[0];
      
      // Extract emails
      const emails = person.emails || [];
      const workEmail = emails.find((e: { type?: string; address?: string }) => e.type === 'professional')?.address;
      const personalEmail = emails.find((e: { type?: string; address?: string }) => e.type === 'personal')?.address;
      
      return {
        full_name: person.full_name || params.full_name,
        first_name: person.first_name,
        last_name: person.last_name,
        age: person.age,
        mobile_phone: mobilePhone ? `+1${mobilePhone}` : null,
        work_phone: null,
        verified_email: workEmail || personalEmail || null,
        personal_email: personalEmail,
        city: person.location_locality,
        state: person.location_region,
        full_address: person.location_street_address,
        job_title: person.job_title,
        company: person.job_company_name,
        linkedin_url: person.linkedin_url,
        confidence_score: data.likelihood || 75,
        source: 'PeopleDataLabs',
        enriched_at: new Date().toISOString(),
        raw_response: person,
      };
      
    } catch (error) {
      console.error('[PDL] Error:', error);
      return null;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// WATERFALL ENRICHMENT ENGINE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * The Waterfall Enrichment Engine.
 * Tries providers in order until a good match is found.
 */
class WaterfallEnricher {
  private providers: EnrichmentProvider[];
  
  constructor() {
    // Initialize providers in priority order
    this.providers = [
      new ApolloProvider(),
      new PeopleDataLabsProvider(),
    ];
  }
  
  /**
   * Get list of available providers.
   */
  getAvailableProviders(): EnrichmentSource[] {
    return this.providers
      .filter(p => p.isAvailable())
      .map(p => p.name);
  }
  
  /**
   * Enrich heir contact information using waterfall strategy.
   * 
   * 1. First tries Apollo API
   * 2. If no phone/email found, falls back to People Data Labs
   * 3. Returns unified ContactInfo with source tracking
   * 
   * @param params - Search parameters
   * @returns EnrichmentResult with contact info and metadata
   */
  async enrichHeirContact(params: PersonSearchParams): Promise<EnrichmentResult> {
    const errors: string[] = [];
    const apisAttempted: EnrichmentSource[] = [];
    let apiCallsMade = 0;
    
    // Check if any providers are available
    const availableProviders = this.providers.filter(p => p.isAvailable());
    
    if (availableProviders.length === 0) {
      console.warn('[Waterfall] No enrichment providers configured. Add API keys to .env.local');
      return {
        success: false,
        status: 'Manual Required',
        contact: null,
        source: 'None',
        errors: ['No enrichment providers configured. Please add APOLLO_API_KEY or PEOPLEDATALABS_API_KEY.'],
        api_calls_made: 0,
        apis_attempted: [],
      };
    }
    
    // Try each provider in order
    for (const provider of availableProviders) {
      console.log(`[Waterfall] Trying ${provider.name} for: ${params.full_name}`);
      apisAttempted.push(provider.name);
      apiCallsMade++;
      
      try {
        const contact = await provider.searchPerson(params);
        
        if (contact) {
          // Check if we got the "money fields" (phone or email)
          const hasPhone = contact.mobile_phone || contact.work_phone;
          const hasEmail = contact.verified_email || contact.personal_email;
          
          if (hasPhone || hasEmail) {
            // SUCCESS: We have actionable contact info
            console.log(`[Waterfall] ✅ SUCCESS via ${provider.name}: Found ${hasPhone ? 'phone' : 'email'}`);
            
            return {
              success: true,
              status: 'Enriched',
              contact,
              source: provider.name,
              errors,
              api_calls_made: apiCallsMade,
              apis_attempted: apisAttempted,
            };
          }
          
          // Partial match - continue to next provider
          console.log(`[Waterfall] Partial match from ${provider.name} - missing phone/email, trying next provider`);
          errors.push(`${provider.name}: Found person but missing phone/email`);
          
          // If this is the last provider, return partial result
          if (provider === availableProviders[availableProviders.length - 1]) {
            return {
              success: true,
              status: 'Partial',
              contact,
              source: provider.name,
              errors,
              api_calls_made: apiCallsMade,
              apis_attempted: apisAttempted,
            };
          }
        } else {
          console.log(`[Waterfall] No match from ${provider.name}`);
          errors.push(`${provider.name}: No match found`);
        }
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[Waterfall] Error from ${provider.name}:`, errorMsg);
        errors.push(`${provider.name}: ${errorMsg}`);
      }
    }
    
    // All providers exhausted without success
    return {
      success: false,
      status: 'Not Found',
      contact: null,
      source: 'None',
      errors,
      api_calls_made: apiCallsMade,
      apis_attempted: apisAttempted,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN EXPORT FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

// Singleton instance
let enricherInstance: WaterfallEnricher | null = null;

function getEnricher(): WaterfallEnricher {
  if (!enricherInstance) {
    enricherInstance = new WaterfallEnricher();
  }
  return enricherInstance;
}

/**
 * Enrich heir contact information using waterfall strategy.
 * 
 * Tries Apollo first, then falls back to People Data Labs.
 * Returns unified contact info with source tracking for ROI analysis.
 * 
 * @example
 * ```typescript
 * const result = await enrichHeirContact({
 *   full_name: 'Michael Robertson',
 *   county: 'Sacramento',
 *   state: 'California',
 *   possible_relation: 'Son',
 * });
 * 
 * if (result.success && result.contact?.mobile_phone) {
 *   console.log(`Call ${result.contact.mobile_phone}`);
 *   console.log(`Data source: ${result.source}`); // Track ROI
 * }
 * ```
 */
export async function enrichHeirContact(
  params: PersonSearchParams
): Promise<EnrichmentResult> {
  const enricher = getEnricher();
  return enricher.enrichHeirContact(params);
}

/**
 * Get list of currently available enrichment providers.
 */
export function getAvailableProviders(): EnrichmentSource[] {
  const enricher = getEnricher();
  return enricher.getAvailableProviders();
}

/**
 * Batch enrich multiple heirs with rate limiting.
 * 
 * @param heirs - Array of heir search params
 * @param delayMs - Delay between API calls to avoid rate limits
 */
export async function batchEnrichHeirs(
  heirs: PersonSearchParams[],
  delayMs: number = 500
): Promise<EnrichmentResult[]> {
  const results: EnrichmentResult[] = [];
  
  for (let i = 0; i < heirs.length; i++) {
    const result = await enrichHeirContact(heirs[i]);
    results.push(result);
    
    // Rate limiting delay (except for last item)
    if (i < heirs.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  return results;
}

// ═══════════════════════════════════════════════════════════════════════════
// SAMPLE DATA FALLBACK (For Development Without API Keys)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate sample contact info for development/testing.
 * Used when no API keys are configured.
 */
export function generateSampleContact(params: PersonSearchParams): ContactInfo {
  const nameParts = params.full_name.split(' ');
  const firstName = nameParts[0];
  const lastName = nameParts[nameParts.length - 1];
  
  return {
    full_name: params.full_name,
    first_name: firstName,
    last_name: lastName,
    age: Math.floor(Math.random() * 40) + 25,
    mobile_phone: `+1-${params.state === 'CA' ? '916' : '555'}-555-${Math.floor(Math.random() * 9000) + 1000}`,
    work_phone: null,
    verified_email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@gmail.com`,
    personal_email: `${firstName.toLowerCase()}${lastName.toLowerCase()}@outlook.com`,
    city: params.city || 'Sacramento',
    state: params.state || 'CA',
    full_address: `${Math.floor(Math.random() * 9000) + 1000} Main St, ${params.city || 'Sacramento'}, ${params.state || 'CA'}`,
    job_title: ['Software Engineer', 'Marketing Manager', 'Teacher', 'Nurse', 'Accountant'][Math.floor(Math.random() * 5)],
    company: ['Tech Corp', 'Health Services Inc', 'State of California', null][Math.floor(Math.random() * 4)],
    linkedin_url: `https://linkedin.com/in/${firstName.toLowerCase()}${lastName.toLowerCase()}`,
    confidence_score: Math.floor(Math.random() * 30) + 70,
    source: 'Manual',
    enriched_at: new Date().toISOString(),
  };
}
