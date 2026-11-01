import { NextResponse } from "next/server";
import { createMemberSessionToken, hashMemberPin, MEMBER_SESSION_COOKIE } from "@/lib/auth";
import { getSql } from "@/lib/db";
import { memberLoginSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const parsed = memberLoginSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  const sql = getSql();
  const [member] = await sql`SELECT m.id, mc.pin_hash FROM members m JOIN member_credentials mc ON mc.member_id = m.id
    WHERE upper(m.member_code) = upper(${parsed.data.memberCode}) AND m.active = true`;
  if (!member || member.pin_hash !== hashMemberPin(parsed.data.pin)) {
    return NextResponse.json({ error: "Kode anggota atau PIN tidak valid." }, { status: 401 });
  }
  const token = await createMemberSessionToken(member.id);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(MEMBER_SESSION_COOKIE, token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 60 * 60 * 8, path: "/",
  });
  return response;
}
