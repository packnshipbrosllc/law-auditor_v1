import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { findPotentialHeirs } from '@/lib/peopledatalabs';
import { 
  enrichHeirContact, 
  getAvailableProviders,
  type EnrichmentResult,
} from '@/lib/enrichment/waterfall';
import { logEnrichmentAttempt } from '@/lib/db';

/**
 * POST /api/research-heirs
 * 
 * Search for potential heirs using Waterfall Enrichment.
 * Tries Apollo first, then falls back to People Data Labs.
 * Tracks source for ROI analysis.
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { decedentName, county, lastKnownAddress, maxResults, useWaterfall } = body;

    if (!decedentName) {
      return NextResponse.json(
        { error: 'Missing decedent name' },
        { status: 400 }
      );
    }

    // Check if we should use waterfall enrichment for individual heir lookup
    if (useWaterfall && body.heirName) {
      // Single heir enrichment via waterfall
      const result = await enrichHeirContact({
        full_name: body.heirName,
        last_name: body.heirLastName,
        county,
        state: 'California',
        decedent_name: decedentName,
        possible_relation: body.possibleRelation,
      });
      
      // Log for ROI tracking
      try {
        await logEnrichmentAttempt({
          user_id: userId,
          heir_name: body.heirName,
          decedent_name: decedentName,
          apis_attempted: result.apis_attempted,
          successful_source: result.source,
          success: result.success,
          has_phone: !!(result.contact?.mobile_phone || result.contact?.work_phone),
          has_email: !!(result.contact?.verified_email || result.contact?.personal_email),
        });
      } catch {
        // Don't fail if logging fails
      }
      
      return NextResponse.json(result);
    }

    // Default: Use the bulk heir search from PDL
    const result = await findPotentialHeirs({
      decedentName,
      county,
      lastKnownAddress,
      maxResults: maxResults || 10,
    });
    
    // Add enrichment provider info to response
    const availableProviders = getAvailableProviders();

    return NextResponse.json({
      ...result,
      enrichment_providers: availableProviders,
      waterfall_available: availableProviders.length > 0,
    });
    
  } catch (error) {
    console.error('POST /api/research-heirs error:', error);
    return NextResponse.json(
      {
        success: false,
        decedent_name: '',
        search_county: null,
        total_found: 0,
        potential_heirs: [],
        search_timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Search failed',
      },
      { status: 500 }
    );
  }
}
