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
  const members = await sql`SELECT id, member_code, name, area, benefit_mode FROM members WHERE location_id = ${location.id} AND active = true ORDER BY created_at DESC LIMIT 30`;
  const deposits = await sql`SELECT d.id, d.net_weight_kg::float8, d.total_value::float8, d.confirmed_at, m.name AS member_name FROM deposits d JOIN members m ON m.id = d.member_id WHERE d.location_id = ${location.id} AND d.status = 'confirmed' ORDER BY d.confirmed_at DESC LIMIT 15`;
  const [price] = await sql`SELECT price_per_kg::float8, effective_at FROM price_history ph JOIN material_categories mc ON mc.id = ph.material_id WHERE ph.location_id = ${location.id} AND mc.code = 'PET-1' ORDER BY effective_at DESC LIMIT 1`;
  return { location, metrics, members, deposits, price: price ?? null };
}

