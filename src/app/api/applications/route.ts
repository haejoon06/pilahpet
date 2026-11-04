import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code")?.trim().toUpperCase();
  if (!code || code.length < 6) return NextResponse.json({ error: "Kode pendaftaran tidak valid." }, { status: 400 });
  const sql = getSql();
  const [row] = await sql`SELECT application_code, name, group_name, participant_category, rt, rw, village,
    status, notes, created_at, reviewed_at
    FROM member_applications WHERE application_code = ${code}`;
  if (!row) return NextResponse.json({ error: "Pendaftaran tidak ditemukan." }, { status: 404 });
  return NextResponse.json(row);
}

export async function POST(request: Request) {
  void request;
  return NextResponse.json({error:"Pendaftaran publik ditutup. Akun warga dibuat oleh pengurus RT dari data kependudukan."},{status:410});
}
