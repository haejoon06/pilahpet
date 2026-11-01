import { requestSession } from "@/lib/auth";
import { getLocation, getSql } from "@/lib/db";

const csv = (rows: Record<string, unknown>[]) => {
  if (!rows.length) return "Tidak ada data\n";
  const headers = Object.keys(rows[0]);
  const quote = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  return [headers.map(quote).join(","), ...rows.map((row) => headers.map((key) => quote(row[key])).join(","))].join("\n");
};

export async function GET(request: Request) {
  const session = await requestSession(request, ["treasurer", "supervisor", "admin"]);
  if (!session) return Response.json({ error: "Tidak berwenang" }, { status: 401 });
  const type = new URL(request.url).searchParams.get("type") ?? "deposits";
  const sql = getSql(); const location = await getLocation(); let rows: Record<string, unknown>[];
  if (type === "members") rows = await sql`SELECT member_code, name, group_name, participant_category,
    rt, rw, village, phone, account_type, benefit_mode, created_at
    FROM members WHERE location_id = ${location!.id} ORDER BY created_at`;
  else if (type === "sales") rows = await sql`SELECT s.sold_at, b.name AS buyer, s.weight_kg, s.price_per_kg, s.gross_value, s.transport_cost, s.net_value FROM sales s JOIN buyers b ON b.id=s.buyer_id WHERE s.location_id=${location!.id} ORDER BY sold_at`;
  else if (type === "cash") rows = await sql`SELECT created_at, entry_type, category, amount, notes, created_by FROM cash_entries WHERE location_id=${location!.id} ORDER BY created_at`;
  else rows = await sql`SELECT d.confirmed_at, m.member_code, m.name, d.net_weight_kg, d.price_snapshot, d.total_value, d.status, d.rejection_reason FROM deposits d JOIN members m ON m.id=d.member_id WHERE d.location_id=${location!.id} ORDER BY confirmed_at`;
  return new Response("\uFEFF" + csv(rows), { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="pilahpet-${type}.csv"` } });
}
