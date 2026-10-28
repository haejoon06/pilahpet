import { NextResponse } from "next/server";
import { requestSession } from "@/lib/auth";
import { getLocation, getSql } from "@/lib/db";
import { depositSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const session = await requestSession(request, ["operator", "treasurer", "supervisor", "admin"]);
  if (!session) return NextResponse.json({ error: "Tidak berwenang" }, { status: 401 });
  const sql = getSql(); const location = await getLocation();
  const rows = await sql`SELECT d.id, m.name AS member_name, d.net_weight_kg::float8, d.price_snapshot::float8, d.total_value::float8, d.confirmed_at FROM deposits d JOIN members m ON m.id = d.member_id WHERE d.location_id = ${location!.id} AND d.status = 'confirmed' ORDER BY d.confirmed_at DESC LIMIT 100`;
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const session = await requestSession(request, ["operator", "admin"]);
  if (!session) return NextResponse.json({ error: "Tidak berwenang" }, { status: 401 });
  const parsed = depositSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  const sql = getSql(); const location = await getLocation(); const d = parsed.data;
  try {
    const [row] = await sql`SELECT confirm_pet_deposit(${location!.id}, ${d.memberId}, ${d.grossKg}, ${d.tareKg}, ${d.clientTransactionId}, ${session.role}) AS id`;
    return NextResponse.json(row, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Transaksi gagal" }, { status: 400 }); }
}

