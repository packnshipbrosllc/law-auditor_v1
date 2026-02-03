import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { findPotentialHeirs } from '@/lib/peopledatalabs';

/**
 * POST /api/research-heirs
 * 
 * Search for potential heirs using People Data Labs API.
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { decedentName, county, lastKnownAddress, maxResults } = body;

    if (!decedentName) {
      return NextResponse.json(
        { error: 'Missing decedent name' },
        { status: 400 }
      );
    }

    // Call People Data Labs API
    const result = await findPotentialHeirs({
      decedentName,
      county,
      lastKnownAddress,
      maxResults: maxResults || 10,
    });

    return NextResponse.json(result);
    
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
