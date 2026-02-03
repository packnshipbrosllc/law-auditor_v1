import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  enrichHeirContact,
  getAvailableProviders,
  generateSampleContact,
  type EnrichmentResult,
  type PersonSearchParams,
} from '@/lib/enrichment/waterfall';
import { logEnrichmentAttempt, updateLeadEnrichmentSource } from '@/lib/db';

/**
 * POST /api/enrich-heir
 * 
 * Waterfall enrichment endpoint.
 * Tries Apollo first, falls back to PDL.
 * Tracks source for ROI analysis.
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { 
      full_name, 
      last_name,
      county, 
      state, 
      city,
      decedent_name,
      possible_relation,
      lead_id, // Optional: If provided, will update the lead's enrichment_source
    } = body;

    if (!full_name) {
      return NextResponse.json(
        { error: 'Missing full_name parameter' },
        { status: 400 }
      );
    }

    // Check available providers
    const availableProviders = getAvailableProviders();
    
    // If no providers, return sample data for development
    if (availableProviders.length === 0) {
      console.log('[Enrich API] No providers available - returning sample data');
      
      const sampleContact = generateSampleContact({
        full_name,
        last_name,
        county,
        state,
        city,
      });
      
      const sampleResult: EnrichmentResult = {
        success: true,
        status: 'Enriched',
        contact: sampleContact,
        source: 'Manual',
        errors: ['No API keys configured - using sample data for development'],
        api_calls_made: 0,
        apis_attempted: [],
      };
      
      return NextResponse.json(sampleResult);
    }

    // Build search params
    const searchParams: PersonSearchParams = {
      full_name,
      last_name,
      county,
      state: state || 'California',
      city,
      decedent_name,
      possible_relation,
    };

    // Execute waterfall enrichment
    const result = await enrichHeirContact(searchParams);

    // Log enrichment attempt for ROI tracking
    try {
      await logEnrichmentAttempt({
        user_id: userId,
        heir_name: full_name,
        decedent_name: decedent_name || null,
        apis_attempted: result.apis_attempted,
        successful_source: result.source,
        success: result.success,
        has_phone: !!(result.contact?.mobile_phone || result.contact?.work_phone),
        has_email: !!(result.contact?.verified_email || result.contact?.personal_email),
      });
    } catch (logError) {
      // Don't fail the request if logging fails
      console.error('[Enrich API] Failed to log enrichment attempt:', logError);
    }

    // Update lead enrichment source if lead_id provided
    if (lead_id && result.source !== 'None') {
      try {
        await updateLeadEnrichmentSource(lead_id, result.source);
      } catch (updateError) {
        console.error('[Enrich API] Failed to update lead enrichment source:', updateError);
      }
    }

    return NextResponse.json(result);
    
  } catch (error) {
    console.error('POST /api/enrich-heir error:', error);
    return NextResponse.json(
      {
        success: false,
        status: 'Manual Required',
        contact: null,
        source: 'None',
        errors: [error instanceof Error ? error.message : 'Enrichment failed'],
        api_calls_made: 0,
        apis_attempted: [],
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/enrich-heir
 * 
 * Get available enrichment providers and status.
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const availableProviders = getAvailableProviders();
    
    return NextResponse.json({
      available_providers: availableProviders,
      apollo_configured: availableProviders.includes('Apollo'),
      pdl_configured: availableProviders.includes('PeopleDataLabs'),
      message: availableProviders.length === 0 
        ? 'No enrichment providers configured. Add API keys to .env.local'
        : `${availableProviders.length} provider(s) available`,
    });
    
  } catch (error) {
    console.error('GET /api/enrich-heir error:', error);
    return NextResponse.json(
      { error: 'Failed to check provider status' },
      { status: 500 }
    );
  }
}
