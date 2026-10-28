import { NextResponse } from "next/server";
import { requestSession } from "@/lib/auth";
import { getLocation, getSql } from "@/lib/db";
import { memberSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const session = await requestSession(request, ["operator", "treasurer", "supervisor", "admin"]);
  if (!session) return NextResponse.json({ error: "Tidak berwenang" }, { status: 401 });
  const sql = getSql(); const location = await getLocation();
  const rows = await sql`SELECT id, member_code, name, area, phone, account_type, benefit_mode FROM members WHERE location_id = ${location!.id} AND active = true ORDER BY created_at DESC`;
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const session = await requestSession(request, ["operator", "admin"]);
  if (!session) return NextResponse.json({ error: "Tidak berwenang" }, { status: 401 });
  const parsed = memberSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  const sql = getSql(); const location = await getLocation(); const data = parsed.data;
  const code = `PET-${Date.now().toString(36).toUpperCase()}`;
  const [row] = await sql`INSERT INTO members(location_id, member_code, name, area, phone, account_type, benefit_mode)
    VALUES(${location!.id}, ${code}, ${data.name}, ${data.area}, ${data.phone || null}, ${data.accountType}, ${data.benefitMode}) RETURNING id, member_code, name`;
  await sql`INSERT INTO audit_logs(location_id, actor, action, entity_type, entity_id, after_data) VALUES(${location!.id}, ${session.role}, 'member.create', 'member', ${row.id}, ${JSON.stringify(row)}::jsonb)`;
  return NextResponse.json(row, { status: 201 });
}

