import { neon } from "@neondatabase/serverless";

export function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL_NOT_CONFIGURED");
  return neon(url);
}

export async function getLocation() {
  const sql = getSql();
  const rows = await sql`SELECT location.id,location.name,location.address,location.rt_number,location.rw_number,
    location.village,location.subdistrict,location.regency,location.province,location.postal_code,
    official.full_name AS chairperson_name,
    official.start_date AS chairperson_start_date,official.end_date AS chairperson_end_date
    FROM locations location
    LEFT JOIN LATERAL (
      SELECT full_name,start_date,end_date FROM rt_officials
      WHERE location_id=location.id AND position='chairperson' AND start_date<=current_date
        AND (end_date IS NULL OR end_date>=current_date)
      ORDER BY start_date DESC LIMIT 1
    ) official ON true
    WHERE location.active=true ORDER BY location.created_at LIMIT 1`;
  return rows[0] as {
    id:string;name:string;address:string|null;rt_number:string|null;rw_number:string|null;village:string|null;
    subdistrict:string|null;regency:string|null;province:string|null;postal_code:string|null;chairperson_name:string|null;
    chairperson_start_date:string|null;chairperson_end_date:string|null;
  }|undefined;
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
    sql`SELECT m.id, m.member_code, m.name, m.group_name, m.participant_category, m.rt, m.rw,
      m.village, m.area, m.phone, m.account_type, m.benefit_mode,
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
    sql`SELECT id, application_code, name, group_name, participant_category, rt, rw, village,
      area, phone, account_type, benefit_mode, status, notes, created_at
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
  const [member] = await sql`SELECT m.id, m.member_code, m.name, m.area, m.account_type, m.benefit_mode,m.participant_category,
    r.nik_last4,r.gender,r.birth_place,r.birth_date,r.religion,r.education,r.occupation,r.family_relationship,
    h.address,h.rt,h.rw,h.village,h.subdistrict,h.regency,h.province,
    COALESCE(sum(bl.amount),0)::float8 AS balance
    FROM members m LEFT JOIN benefit_ledger bl ON bl.member_id = m.id
    LEFT JOIN residents r ON r.id=m.resident_id LEFT JOIN households h ON h.id=r.household_id
    WHERE m.id = ${memberId} AND m.active = true GROUP BY m.id,r.id,h.id`;
  if (!member) throw new Error("MEMBER_NOT_FOUND");
  const deposits = await sql`SELECT id, net_weight_kg::float8, price_snapshot::float8, total_value::float8,
    status, confirmed_at, rejection_reason FROM deposits WHERE member_id = ${memberId}
    ORDER BY confirmed_at DESC LIMIT 100`;
  const [vouchers,letters,bottleEvents]=await Promise.all([
    sql`SELECT vl.id,vl.amount::float8,vl.status,vl.created_at,be.bottle_count,be.weight_kg::float8
      FROM voucher_ledger vl JOIN bottle_events be ON be.id=vl.bottle_event_id WHERE vl.member_id=${memberId} ORDER BY vl.created_at DESC LIMIT 100`,
    sql`SELECT id,letter_type,purpose,status,letter_number,notes,created_at,reviewed_at FROM letter_requests WHERE member_id=${memberId} ORDER BY created_at DESC LIMIT 100`,
    sql`SELECT id,bottle_count,weight_kg::float8,voucher_amount::float8,claimed_at,device_code FROM bottle_events WHERE claimed_by=${memberId} ORDER BY claimed_at DESC LIMIT 100`,
  ]);
  return { member, deposits,vouchers,letters,bottleEvents };
}

