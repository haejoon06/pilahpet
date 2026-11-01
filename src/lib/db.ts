import { neon } from "@neondatabase/serverless";

export function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL_NOT_CONFIGURED");
  return neon(url);
}

export async function getLocation() {
  const sql = getSql();
  const rows = await sql`SELECT id, name, address FROM locations WHERE active = true ORDER BY created_at LIMIT 1`;
  return rows[0] as { id: string; name: string; address: string | null } | undefined;
}

export async function getDashboardData() {
  const sql = getSql();
  const location = await getLocation();
  if (!location) throw new Error("LOCATION_NOT_CONFIGURED");
  const [metrics] = await sql`
    SELECT
      (SELECT count(*)::int FROM members WHERE location_id = ${location.id} AND active = true) AS members,
      (SELECT count(*)::int FROM deposits WHERE location_id = ${location.id} AND status = 'confirmed') AS deposits,
      (SELECT COALESCE(sum(quantity_kg),0)::float8 FROM stock_movements WHERE location_id = ${location.id}) AS stock_kg,
      (SELECT COALESCE(sum(CASE WHEN entry_type = 'income' THEN amount ELSE -amount END),0)::float8 FROM cash_entries WHERE location_id = ${location.id}) AS cash_balance,
      (SELECT COALESCE(sum(net_weight_kg),0)::float8 FROM deposits WHERE location_id = ${location.id} AND status = 'confirmed') AS collected_kg
  `;
  const [members, deposits, prices, applications, sales, cashEntries, maintenance, audits] = await Promise.all([
    sql`SELECT m.id, m.member_code, m.name, m.area, m.phone, m.account_type, m.benefit_mode,
      COALESCE(sum(bl.amount),0)::float8 AS balance
      FROM members m LEFT JOIN benefit_ledger bl ON bl.member_id = m.id
      WHERE m.location_id = ${location.id} AND m.active = true
      GROUP BY m.id ORDER BY m.created_at DESC LIMIT 100`,
    sql`SELECT d.id, d.net_weight_kg::float8, d.price_snapshot::float8, d.total_value::float8, d.status,
      d.confirmed_at, d.rejection_reason, m.name AS member_name, m.member_code
      FROM deposits d JOIN members m ON m.id = d.member_id
      WHERE d.location_id = ${location.id} ORDER BY d.confirmed_at DESC LIMIT 100`,
    sql`SELECT ph.id, ph.price_per_kg::float8, ph.effective_at
      FROM price_history ph JOIN material_categories mc ON mc.id = ph.material_id
      WHERE ph.location_id = ${location.id} AND mc.code = 'PET-1' ORDER BY effective_at DESC LIMIT 20`,
    sql`SELECT id, application_code, name, area, phone, account_type, benefit_mode, status, notes, created_at
      FROM member_applications WHERE location_id = ${location.id} ORDER BY created_at DESC LIMIT 100`,
    sql`SELECT s.id, b.name AS buyer_name, s.weight_kg::float8, s.price_per_kg::float8,
      s.gross_value::float8, s.transport_cost::float8, s.net_value::float8, s.sold_at
      FROM sales s JOIN buyers b ON b.id = s.buyer_id WHERE s.location_id = ${location.id}
      ORDER BY s.sold_at DESC LIMIT 100`,
    sql`SELECT id, entry_type, category, amount::float8, notes, created_by, created_at
      FROM cash_entries WHERE location_id = ${location.id} ORDER BY created_at DESC LIMIT 100`,
    sql`SELECT id, inspection_type, finding, action_taken, critical, inspected_by, inspected_at
      FROM maintenance_logs WHERE location_id = ${location.id} ORDER BY inspected_at DESC LIMIT 100`,
    sql`SELECT id, actor, action, entity_type, entity_id, created_at
      FROM audit_logs WHERE location_id = ${location.id} ORDER BY created_at DESC LIMIT 100`,
  ]);
  return { location, metrics, members, deposits, price: prices[0] ?? null, prices, applications, sales, cashEntries, maintenance, audits };
}

export async function getMemberPortalData(memberId: string) {
  const sql = getSql();
  const [member] = await sql`SELECT m.id, m.member_code, m.name, m.area, m.account_type, m.benefit_mode,
    COALESCE(sum(bl.amount),0)::float8 AS balance
    FROM members m LEFT JOIN benefit_ledger bl ON bl.member_id = m.id
    WHERE m.id = ${memberId} AND m.active = true GROUP BY m.id`;
  if (!member) throw new Error("MEMBER_NOT_FOUND");
  const deposits = await sql`SELECT id, net_weight_kg::float8, price_snapshot::float8, total_value::float8,
    status, confirmed_at, rejection_reason FROM deposits WHERE member_id = ${memberId}
    ORDER BY confirmed_at DESC LIMIT 100`;
  return { member, deposits };
}

