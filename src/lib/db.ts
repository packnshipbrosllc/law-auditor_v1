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

// ═══════════════════════════════════════════════════════════════════════════
// DECEASED LEADS TABLE (Estate Recovery)
// ═══════════════════════════════════════════════════════════════════════════

export type DeceasedLeadStatus = 'new' | 'contacted' | 'claimed';

export interface PotentialHeir {
  name: string;
  relation: string; // e.g., "Spouse", "Child", "Sibling", "Parent"
  contact_info: string | null; // Phone, email, or address
}

export interface DeceasedLead {
  id: string;
  original_owner: string;
  asset_amount: number;
  potential_fee: number; // 10% of asset_amount
  source_url: string | null;
  date_listed: string;
  status: DeceasedLeadStatus;
  potential_heirs: PotentialHeir[];
  // Metadata
  county: string | null;
  state: string;
  property_type: string; // Cash, Securities, Safe Deposit, etc.
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export async function createDeceasedLeadsTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS deceased_leads (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      original_owner TEXT NOT NULL,
      asset_amount DECIMAL(12, 2) NOT NULL,
      potential_fee DECIMAL(12, 2) NOT NULL,
      source_url TEXT,
      date_listed DATE NOT NULL,
      status TEXT DEFAULT 'new',
      potential_heirs JSONB DEFAULT '[]'::jsonb,
      county TEXT,
      state TEXT DEFAULT 'CA',
      property_type TEXT DEFAULT 'Cash',
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  
  // Create indexes
  await sql`
    CREATE INDEX IF NOT EXISTS idx_deceased_leads_status ON deceased_leads(status);
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_deceased_leads_state ON deceased_leads(state);
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_deceased_leads_amount ON deceased_leads(asset_amount DESC);
  `;
}

export async function getDeceasedLeads(filters?: {
  status?: DeceasedLeadStatus | string;
  state?: string;
  minAmount?: number;
  limit?: number;
}): Promise<DeceasedLead[]> {
  const { status, state, minAmount = 1000, limit = 100 } = filters || {};
  
  let result;
  
  // Filter by status if provided and not 'all'
  if (status && status !== 'all') {
    result = await sql`
      SELECT * FROM deceased_leads 
      WHERE asset_amount >= ${minAmount}
      AND status = ${status}
      ORDER BY asset_amount DESC
      LIMIT ${limit}
    `;
  } else if (state && state !== 'all') {
    // Filter by state if provided and not 'all'
    result = await sql`
      SELECT * FROM deceased_leads 
      WHERE asset_amount >= ${minAmount}
      AND state = ${state}
      ORDER BY asset_amount DESC
      LIMIT ${limit}
    `;
  } else {
    // No specific filters, return all above minAmount
    result = await sql`
      SELECT * FROM deceased_leads 
      WHERE asset_amount >= ${minAmount}
      ORDER BY asset_amount DESC
      LIMIT ${limit}
    `;
  }
  
  return result.rows.map(row => ({
    ...row,
    potential_heirs: row.potential_heirs || [],
  })) as DeceasedLead[];
}

export async function getDeceasedLead(id: string): Promise<DeceasedLead | null> {
  const result = await sql`
    SELECT * FROM deceased_leads WHERE id = ${id};
  `;
  if (result.rows[0]) {
    return {
      ...result.rows[0],
      potential_heirs: result.rows[0].potential_heirs || [],
    } as DeceasedLead;
  }
  return null;
}

export async function saveDeceasedLead(lead: Omit<DeceasedLead, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
  const result = await sql`
    INSERT INTO deceased_leads (
      original_owner, asset_amount, potential_fee, source_url, date_listed,
      status, potential_heirs, county, state, property_type, notes
    )
    VALUES (
      ${lead.original_owner}, ${lead.asset_amount}, ${lead.potential_fee},
      ${lead.source_url}, ${lead.date_listed}, ${lead.status},
      ${JSON.stringify(lead.potential_heirs)}::jsonb,
      ${lead.county}, ${lead.state}, ${lead.property_type}, ${lead.notes}
    )
    RETURNING id;
  `;
  return result.rows[0].id;
}

export async function updateDeceasedLeadStatus(id: string, status: DeceasedLeadStatus) {
  await sql`
    UPDATE deceased_leads
    SET status = ${status}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id};
  `;
}

export async function updateDeceasedLeadHeirs(id: string, heirs: PotentialHeir[]) {
  await sql`
    UPDATE deceased_leads
    SET potential_heirs = ${JSON.stringify(heirs)}::jsonb, updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id};
  `;
}

export async function bulkInsertDeceasedLeads(leads: Array<Omit<DeceasedLead, 'id' | 'created_at' | 'updated_at'>>): Promise<number> {
  let inserted = 0;
  
  for (const lead of leads) {
    try {
      await saveDeceasedLead(lead);
      inserted++;
    } catch (error) {
      console.error(`Failed to insert deceased lead: ${lead.original_owner}`, error);
    }
  }
  
  return inserted;
}

export async function deleteDeceasedLead(id: string) {
  await sql`
    DELETE FROM deceased_leads WHERE id = ${id};
  `;
}

export async function getDeceasedLeadStats() {
  const result = await sql`
    SELECT 
      COUNT(*) as total_leads,
      SUM(asset_amount) as total_value,
      SUM(potential_fee) as total_fees,
      COUNT(CASE WHEN status = 'new' THEN 1 END) as new_count,
      COUNT(CASE WHEN status = 'contacted' THEN 1 END) as contacted_count,
      COUNT(CASE WHEN status = 'claimed' THEN 1 END) as claimed_count,
      SUM(CASE WHEN status = 'claimed' THEN potential_fee ELSE 0 END) as claimed_fees
    FROM deceased_leads;
  `;
  return result.rows[0];
}

// ═══════════════════════════════════════════════════════════════════════════
// DECEASED LEADS MODULE (Refined Model)
// ═══════════════════════════════════════════════════════════════════════════

export type DeceasedModuleStatus = 'New' | 'Skip-Tracing' | 'Contacted';

export interface ReportedHeir {
  name: string;
  relation: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  confidence?: number; // 0-100 confidence score
  source?: string; // e.g., "SCO Database", "PeopleDataLabs", "Manual"
}

export interface DeceasedLeadModule {
  id: string;
  property_id: string;
  decedent_name: string;
  available_balance: number;
  reported_heirs: ReportedHeir[];
  status: DeceasedModuleStatus;
  // Additional useful fields
  last_known_address: string | null;
  date_of_death: string | null;
  date_reported: string;
  property_type: string;
  holder_name: string | null; // Bank, insurance company, etc.
  state: string;
  county: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export async function createDeceasedLeadModuleTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS deceased_lead_module (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      property_id TEXT NOT NULL UNIQUE,
      decedent_name TEXT NOT NULL,
      available_balance DECIMAL(12, 2) NOT NULL,
      reported_heirs JSONB DEFAULT '[]'::jsonb,
      status TEXT DEFAULT 'New',
      last_known_address TEXT,
      date_of_death DATE,
      date_reported DATE NOT NULL,
      property_type TEXT DEFAULT 'Cash',
      holder_name TEXT,
      state TEXT DEFAULT 'CA',
      county TEXT,
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  
  // Create indexes for common filters
  await sql`
    CREATE INDEX IF NOT EXISTS idx_dlm_status ON deceased_lead_module(status);
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_dlm_balance ON deceased_lead_module(available_balance DESC);
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_dlm_state ON deceased_lead_module(state);
  `;
}

export async function getDeceasedLeadModules(filters?: {
  status?: DeceasedModuleStatus | 'all';
  state?: string;
  minBalance?: number;
  limit?: number;
}): Promise<DeceasedLeadModule[]> {
  const { status, state, minBalance = 10000, limit = 100 } = filters || {};
  
  let result;
  
  if (status && status !== 'all') {
    result = await sql`
      SELECT * FROM deceased_lead_module 
      WHERE available_balance >= ${minBalance}
      AND status = ${status}
      ORDER BY available_balance DESC
      LIMIT ${limit}
    `;
  } else if (state && state !== 'all') {
    result = await sql`
      SELECT * FROM deceased_lead_module 
      WHERE available_balance >= ${minBalance}
      AND state = ${state}
      ORDER BY available_balance DESC
      LIMIT ${limit}
    `;
  } else {
    result = await sql`
      SELECT * FROM deceased_lead_module 
      WHERE available_balance >= ${minBalance}
      ORDER BY available_balance DESC
      LIMIT ${limit}
    `;
  }
  
  return result.rows.map(row => ({
    ...row,
    reported_heirs: row.reported_heirs || [],
  })) as DeceasedLeadModule[];
}

export async function getDeceasedLeadModule(id: string): Promise<DeceasedLeadModule | null> {
  const result = await sql`
    SELECT * FROM deceased_lead_module WHERE id = ${id};
  `;
  if (result.rows[0]) {
    return {
      ...result.rows[0],
      reported_heirs: result.rows[0].reported_heirs || [],
    } as DeceasedLeadModule;
  }
  return null;
}

export async function saveDeceasedLeadModule(lead: Omit<DeceasedLeadModule, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
  const result = await sql`
    INSERT INTO deceased_lead_module (
      property_id, decedent_name, available_balance, reported_heirs, status,
      last_known_address, date_of_death, date_reported, property_type,
      holder_name, state, county, notes
    )
    VALUES (
      ${lead.property_id}, ${lead.decedent_name}, ${lead.available_balance},
      ${JSON.stringify(lead.reported_heirs)}::jsonb, ${lead.status},
      ${lead.last_known_address}, ${lead.date_of_death}, ${lead.date_reported},
      ${lead.property_type}, ${lead.holder_name}, ${lead.state}, ${lead.county}, ${lead.notes}
    )
    ON CONFLICT (property_id) DO UPDATE SET
      decedent_name = EXCLUDED.decedent_name,
      available_balance = EXCLUDED.available_balance,
      reported_heirs = EXCLUDED.reported_heirs,
      updated_at = CURRENT_TIMESTAMP
    RETURNING id;
  `;
  return result.rows[0].id;
}

export async function updateDeceasedLeadModuleStatus(id: string, status: DeceasedModuleStatus) {
  await sql`
    UPDATE deceased_lead_module
    SET status = ${status}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id};
  `;
}

export async function updateDeceasedLeadModuleHeirs(id: string, heirs: ReportedHeir[]) {
  await sql`
    UPDATE deceased_lead_module
    SET reported_heirs = ${JSON.stringify(heirs)}::jsonb, updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id};
  `;
}

export async function bulkInsertDeceasedLeadModules(leads: Array<Omit<DeceasedLeadModule, 'id' | 'created_at' | 'updated_at'>>): Promise<number> {
  let inserted = 0;
  
  for (const lead of leads) {
    try {
      await saveDeceasedLeadModule(lead);
      inserted++;
    } catch (error) {
      console.error(`Failed to insert deceased lead module: ${lead.decedent_name}`, error);
    }
  }
  
  return inserted;
}

export async function getDeceasedLeadModuleStats(minBalance: number = 10000) {
  const result = await sql`
    SELECT 
      COUNT(*) as total_leads,
      SUM(available_balance) as total_value,
      SUM(available_balance * 0.10) as total_potential_fees,
      COUNT(CASE WHEN status = 'New' THEN 1 END) as new_count,
      COUNT(CASE WHEN status = 'Skip-Tracing' THEN 1 END) as skip_tracing_count,
      COUNT(CASE WHEN status = 'Contacted' THEN 1 END) as contacted_count,
      COUNT(CASE WHEN available_balance >= 25000 THEN 1 END) as gold_count,
      SUM(CASE WHEN available_balance >= 25000 THEN available_balance * 0.10 ELSE 0 END) as gold_fees
    FROM deceased_lead_module
    WHERE available_balance >= ${minBalance};
  `;
  return result.rows[0];
}

