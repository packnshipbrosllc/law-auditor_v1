import { sql } from '@vercel/postgres';

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

