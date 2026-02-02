import { sql } from '@vercel/postgres';

// ═══════════════════════════════════════════════════════════════════════════
// AUDITS TABLE
// ═══════════════════════════════════════════════════════════════════════════

export async function createAuditsTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS audits (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL,
      total_recovery DECIMAL(12, 2) NOT NULL,
      success_fee DECIMAL(12, 2) NOT NULL,
      is_paid BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
}

export async function saveAudit(userId: string, totalRecovery: number, successFee: number) {
  const result = await sql`
    INSERT INTO audits (user_id, total_recovery, success_fee)
    VALUES (${userId}, ${totalRecovery}, ${successFee})
    RETURNING id;
  `;
  return result.rows[0].id;
}

export async function getAudit(id: string) {
  const result = await sql`
    SELECT * FROM audits WHERE id = ${id};
  `;
  return result.rows[0];
}

export async function updateAuditPaidStatus(id: string, isPaid: boolean) {
  await sql`
    UPDATE audits
    SET is_paid = ${isPaid}
    WHERE id = ${id};
  `;
}

// ═══════════════════════════════════════════════════════════════════════════
// WHALE LEADS TABLE (Asset Recovery)
// ═══════════════════════════════════════════════════════════════════════════

export interface WhaleLead {
  id: string;
  owner_name: string;
  city: string;
  cash_reported: number;
  potential_fee: number;
  property_type: string;
  status: 'new' | 'contacted' | 'high_interest' | 'signed' | 'recovered';
  // Decision Maker (Apollo Enriched)
  decision_maker_name: string | null;
  decision_maker_title: string | null;
  direct_email: string | null;
  direct_phone: string | null;
  linkedin_url: string | null;
  enrichment_status: 'Enriched' | 'Needs Manual Research' | 'Pending';
  // Metadata
  last_contact: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export async function createWhaleLeadsTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS whale_leads (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_name TEXT NOT NULL,
      city TEXT NOT NULL,
      cash_reported DECIMAL(12, 2) NOT NULL,
      potential_fee DECIMAL(12, 2) NOT NULL,
      property_type TEXT DEFAULT 'Cash',
      status TEXT DEFAULT 'new',
      decision_maker_name TEXT,
      decision_maker_title TEXT,
      direct_email TEXT,
      direct_phone TEXT,
      linkedin_url TEXT,
      enrichment_status TEXT DEFAULT 'Pending',
      last_contact TIMESTAMP WITH TIME ZONE,
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  
  // Create index on city for filtering
  await sql`
    CREATE INDEX IF NOT EXISTS idx_whale_leads_city ON whale_leads(city);
  `;
  
  // Create index on status for filtering
  await sql`
    CREATE INDEX IF NOT EXISTS idx_whale_leads_status ON whale_leads(status);
  `;
}

export async function getWhaleLeads(filters?: {
  city?: string;
  minValue?: number;
  status?: string;
  limit?: number;
}): Promise<WhaleLead[]> {
  const { city, minValue = 5000, status, limit = 200 } = filters || {};
  
  let query = sql`
    SELECT * FROM whale_leads 
    WHERE cash_reported >= ${minValue}
  `;
  
  if (city && city !== 'all') {
    query = sql`
      SELECT * FROM whale_leads 
      WHERE cash_reported >= ${minValue}
      AND city = ${city}
      ORDER BY cash_reported DESC
      LIMIT ${limit}
    `;
  } else if (status && status !== 'all') {
    query = sql`
      SELECT * FROM whale_leads 
      WHERE cash_reported >= ${minValue}
      AND status = ${status}
      ORDER BY cash_reported DESC
      LIMIT ${limit}
    `;
  } else {
    query = sql`
      SELECT * FROM whale_leads 
      WHERE cash_reported >= ${minValue}
      ORDER BY cash_reported DESC
      LIMIT ${limit}
    `;
  }
  
  const result = await query;
  return result.rows as WhaleLead[];
}

export async function getWhaleLead(id: string): Promise<WhaleLead | null> {
  const result = await sql`
    SELECT * FROM whale_leads WHERE id = ${id};
  `;
  return result.rows[0] as WhaleLead || null;
}

export async function saveWhaleLead(lead: Omit<WhaleLead, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
  const result = await sql`
    INSERT INTO whale_leads (
      owner_name, city, cash_reported, potential_fee, property_type, status,
      decision_maker_name, decision_maker_title, direct_email, direct_phone,
      linkedin_url, enrichment_status, last_contact, notes
    )
    VALUES (
      ${lead.owner_name}, ${lead.city}, ${lead.cash_reported}, ${lead.potential_fee},
      ${lead.property_type}, ${lead.status}, ${lead.decision_maker_name},
      ${lead.decision_maker_title}, ${lead.direct_email}, ${lead.direct_phone},
      ${lead.linkedin_url}, ${lead.enrichment_status}, ${lead.last_contact}, ${lead.notes}
    )
    RETURNING id;
  `;
  return result.rows[0].id;
}

export async function updateWhaleLeadStatus(id: string, status: WhaleLead['status']) {
  await sql`
    UPDATE whale_leads
    SET status = ${status}, 
        last_contact = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id};
  `;
}

export async function updateWhaleLead(id: string, updates: Partial<WhaleLead>) {
  // Build dynamic update - for simplicity, update specific fields
  if (updates.status) {
    await sql`
      UPDATE whale_leads
      SET status = ${updates.status}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id};
    `;
  }
  if (updates.decision_maker_name) {
    await sql`
      UPDATE whale_leads
      SET decision_maker_name = ${updates.decision_maker_name},
          decision_maker_title = ${updates.decision_maker_title || null},
          direct_email = ${updates.direct_email || null},
          direct_phone = ${updates.direct_phone || null},
          linkedin_url = ${updates.linkedin_url || null},
          enrichment_status = 'Enriched',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id};
    `;
  }
  if (updates.notes) {
    await sql`
      UPDATE whale_leads
      SET notes = ${updates.notes}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id};
    `;
  }
}

export async function bulkInsertWhaleLeads(leads: Array<Omit<WhaleLead, 'id' | 'created_at' | 'updated_at'>>): Promise<number> {
  let inserted = 0;
  
  for (const lead of leads) {
    try {
      await saveWhaleLead(lead);
      inserted++;
    } catch (error) {
      console.error(`Failed to insert lead: ${lead.owner_name}`, error);
    }
  }
  
  return inserted;
}

export async function deleteWhaleLead(id: string) {
  await sql`
    DELETE FROM whale_leads WHERE id = ${id};
  `;
}

export async function getWhaleLeadStats() {
  const result = await sql`
    SELECT 
      COUNT(*) as total_leads,
      SUM(cash_reported) as total_value,
      SUM(potential_fee) as total_fees,
      COUNT(CASE WHEN status = 'high_interest' OR status = 'signed' THEN 1 END) as hot_leads,
      SUM(CASE WHEN status = 'high_interest' OR status = 'signed' THEN potential_fee ELSE 0 END) as projected_commission,
      COUNT(CASE WHEN enrichment_status = 'Enriched' THEN 1 END) as enriched_count,
      COUNT(CASE WHEN cash_reported >= 25000 THEN 1 END) as gold_count,
      COUNT(CASE WHEN cash_reported >= 10000 AND cash_reported < 25000 THEN 1 END) as silver_count,
      COUNT(CASE WHEN cash_reported >= 5000 AND cash_reported < 10000 THEN 1 END) as auto_count
    FROM whale_leads;
  `;
  return result.rows[0];
}

export async function getWhaleLeadCities(): Promise<string[]> {
  const result = await sql`
    SELECT DISTINCT city FROM whale_leads ORDER BY city;
  `;
  return result.rows.map(r => r.city);
}

