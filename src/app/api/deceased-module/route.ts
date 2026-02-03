import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  getDeceasedLeadModules,
  saveDeceasedLeadModule,
  updateDeceasedLeadModuleStatus,
  updateDeceasedLeadModuleHeirs,
  getDeceasedLeadModuleStats,
  createDeceasedLeadModuleTable,
  DeceasedModuleStatus,
  ReportedHeir,
} from '@/lib/db';

/**
 * GET /api/deceased-module
 * 
 * Fetch deceased leads with optional filters.
 * Query params: minBalance, status, state, stats
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const minBalance = parseInt(searchParams.get('minBalance') || '10000');
    const status = searchParams.get('status') as DeceasedModuleStatus | 'all' | null;
    const state = searchParams.get('state');
    const getStats = searchParams.get('stats') === 'true';

    // Return stats only
    if (getStats) {
      const stats = await getDeceasedLeadModuleStats(minBalance);
      return NextResponse.json({ stats });
    }

    // Return filtered leads
    const leads = await getDeceasedLeadModules({
      minBalance,
      status: status || 'all',
      state: state || undefined,
    });

    return NextResponse.json({ leads });
    
  } catch (error) {
    console.error('GET /api/deceased-module error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leads', leads: [] },
      { status: 500 }
    );
  }
}

/**
 * POST /api/deceased-module
 * 
 * Create a new deceased lead or bulk insert.
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Ensure table exists
    await createDeceasedLeadModuleTable();

    // Single lead creation
    const id = await saveDeceasedLeadModule({
      property_id: body.property_id,
      decedent_name: body.decedent_name,
      available_balance: body.available_balance,
      reported_heirs: body.reported_heirs || [],
      status: body.status || 'New',
      last_known_address: body.last_known_address || null,
      date_of_death: body.date_of_death || null,
      date_reported: body.date_reported || new Date().toISOString().split('T')[0],
      property_type: body.property_type || 'Cash',
      holder_name: body.holder_name || null,
      state: body.state || 'CA',
      county: body.county || null,
      notes: body.notes || null,
    });

    return NextResponse.json({ success: true, id });
    
  } catch (error) {
    console.error('POST /api/deceased-module error:', error);
    return NextResponse.json(
      { error: 'Failed to create lead' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/deceased-module
 * 
 * Update a deceased lead's status or heirs.
 */
export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, status, heirs } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing lead ID' }, { status: 400 });
    }

    // Update status
    if (status) {
      await updateDeceasedLeadModuleStatus(id, status as DeceasedModuleStatus);
    }

    // Update heirs
    if (heirs) {
      await updateDeceasedLeadModuleHeirs(id, heirs as ReportedHeir[]);
    }

    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('PATCH /api/deceased-module error:', error);
    return NextResponse.json(
      { error: 'Failed to update lead' },
      { status: 500 }
    );
  }
}
