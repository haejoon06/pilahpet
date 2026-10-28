import { NextResponse } from "next/server";
import { requestSession } from "@/lib/auth";
import { getLocation, getSql } from "@/lib/db";
import { priceSchema } from "@/lib/validation";

export async function GET() {
  const sql = getSql(); const location = await getLocation();
  const rows = await sql`SELECT ph.id, ph.price_per_kg::float8, ph.effective_at FROM price_history ph JOIN material_categories mc ON mc.id = ph.material_id WHERE ph.location_id = ${location!.id} AND mc.code = 'PET-1' ORDER BY effective_at DESC LIMIT 20`;
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const session = await requestSession(request, ["treasurer", "admin"]);
  if (!session) return NextResponse.json({ error: "Tidak berwenang" }, { status: 401 });
  const parsed = priceSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  const sql = getSql(); const location = await getLocation();
  const [row] = await sql`INSERT INTO price_history(location_id, material_id, price_per_kg, created_by)
    SELECT ${location!.id}, id, ${parsed.data.pricePerKg}, ${session.role} FROM material_categories WHERE code = 'PET-1'
    RETURNING id, price_per_kg::float8, effective_at`;
  return NextResponse.json(row, { status: 201 });
}

