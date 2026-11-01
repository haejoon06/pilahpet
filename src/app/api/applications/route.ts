import { NextResponse } from "next/server";
import { getLocation, getSql } from "@/lib/db";
import { publicApplicationSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code")?.trim().toUpperCase();
  if (!code || code.length < 6) return NextResponse.json({ error: "Kode pendaftaran tidak valid." }, { status: 400 });
  const sql = getSql();
  const [row] = await sql`SELECT application_code, name, status, notes, created_at, reviewed_at
    FROM member_applications WHERE application_code = ${code}`;
  if (!row) return NextResponse.json({ error: "Pendaftaran tidak ditemukan." }, { status: 404 });
  return NextResponse.json(row);
}

export async function POST(request: Request) {
  const parsed = publicApplicationSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  const sql = getSql(); const location = await getLocation(); const data = parsed.data;
  if (!location) return NextResponse.json({ error: "Lokasi layanan belum tersedia." }, { status: 503 });
  const code = `REG-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,5).toUpperCase()}`;
  const [row] = await sql`INSERT INTO member_applications(location_id, application_code, name, area, phone, account_type, benefit_mode)
    VALUES(${location.id}, ${code}, ${data.name}, ${data.area}, ${data.phone}, ${data.accountType}, ${data.benefitMode})
    RETURNING application_code, name, status, created_at`;
  await sql`INSERT INTO audit_logs(location_id, actor, action, entity_type, entity_id, after_data)
    VALUES(${location.id}, 'public', 'application.create', 'member_application', null, ${JSON.stringify({ applicationCode: code, name: data.name })}::jsonb)`;
  return NextResponse.json(row, { status: 201 });
}
