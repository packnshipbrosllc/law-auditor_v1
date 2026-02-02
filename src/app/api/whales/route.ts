import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { 
  getWhaleLeads, 
  saveWhaleLead, 
  updateWhaleLeadStatus,
  bulkInsertWhaleLeads,
  getWhaleLeadStats,
  getWhaleLeadCities,
  createWhaleLeadsTable,
  WhaleLead
} from '@/lib/db';

// GET /api/whales - Fetch whale leads with filters
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const city = searchParams.get('city') || undefined;
    const minValue = parseInt(searchParams.get('minValue') || '5000');
    const status = searchParams.get('status') || undefined;
    const limit = parseInt(searchParams.get('limit') || '200');
    const includeStats = searchParams.get('stats') === 'true';
    const citiesOnly = searchParams.get('cities') === 'true';

    // Return just cities list
    if (citiesOnly) {
      const cities = await getWhaleLeadCities();
      return NextResponse.json({ cities });
    }

    // Fetch leads
    const leads = await getWhaleLeads({ city, minValue, status, limit });
    
    // Optionally include stats
    let stats = null;
    if (includeStats) {
      stats = await getWhaleLeadStats();
    }

    return NextResponse.json({ 
      leads,
      stats,
      count: leads.length 
    });

  } catch (error) {
    console.error('Error fetching whale leads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    );
  }
}

// POST /api/whales - Create new lead or bulk import
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    
    // Check if bulk import
    if (body.bulk && Array.isArray(body.leads)) {
      // Ensure table exists
      await createWhaleLeadsTable();
      
      const leads = body.leads.map((l: Record<string, unknown>) => ({
        owner_name: String(l.BUSINESS_NAME || l.owner_name || l.ownerName || ''),
        city: String(l.CITY || l.city || ''),
        cash_reported: Number(l.UNCLAIMED_VALUE || l.cash_reported || l.cashReported) || 0,
        potential_fee: Number(l.YOUR_FEE_10PCT || l.potential_fee || l.potentialFee) || 0,
        property_type: String(l.property_type || l.propertyType || 'Cash'),
        status: 'new' as const,
        decision_maker_name: String(l.CONTACT_NAME || l.decision_maker_name || l.contactName || '') || null,
        decision_maker_title: String(l.CONTACT_TITLE || l.decision_maker_title || l.contactTitle || '') || null,
        direct_email: String(l.CONTACT_EMAIL || l.direct_email || l.contactEmail || '') || null,
        direct_phone: String(l.CONTACT_PHONE || l.direct_phone || l.contactPhone || '') || null,
        linkedin_url: String(l.LINKEDIN_URL || l.linkedin_url || l.linkedinUrl || '') || null,
        enrichment_status: (l.ENRICHMENT_STATUS || l.enrichment_status || l.enrichmentStatus || 'Pending') as WhaleLead['enrichment_status'],
        last_contact: null,
        notes: null,
      }));

      const inserted = await bulkInsertWhaleLeads(leads);
      
      return NextResponse.json({ 
        success: true, 
        inserted,
        total: leads.length 
      });
    }

    // Single lead creation
    const lead = {
      owner_name: body.owner_name || body.ownerName,
      city: body.city,
      cash_reported: body.cash_reported || body.cashReported,
      potential_fee: body.potential_fee || body.potentialFee,
      property_type: body.property_type || 'Cash',
      status: 'new' as const,
      decision_maker_name: body.decision_maker_name || body.contactName || null,
      decision_maker_title: body.decision_maker_title || body.contactTitle || null,
      direct_email: body.direct_email || body.contactEmail || null,
      direct_phone: body.direct_phone || body.contactPhone || null,
      linkedin_url: body.linkedin_url || body.linkedinUrl || null,
      enrichment_status: body.enrichment_status || 'Pending' as const,
      last_contact: null,
      notes: body.notes || null,
    };

    const id = await saveWhaleLead(lead);
    
    return NextResponse.json({ success: true, id });

  } catch (error) {
    console.error('Error creating whale lead:', error);
    return NextResponse.json(
      { error: 'Failed to create lead' },
      { status: 500 }
    );
  }
}

// PATCH /api/whales - Update lead status
export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: 'Missing id or status' },
        { status: 400 }
      );
    }

    await updateWhaleLeadStatus(id, status);
    
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error updating whale lead:', error);
    return NextResponse.json(
      { error: 'Failed to update lead' },
      { status: 500 }
    );
  }
}
