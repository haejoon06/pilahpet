import { NextResponse } from "next/server";
import { authConfigured, createSessionToken, SESSION_COOKIE, verifyAccessCode } from "@/lib/auth";
import { roleSchema } from "@/lib/validation";

export async function POST(request: Request) {
  if (!authConfigured()) return NextResponse.json({ error: "Autentikasi belum dikonfigurasi oleh administrator." }, { status: 503 });
  const body = await request.json().catch(() => ({}));
  const role = roleSchema.safeParse(body.role);
  if (!role.success || typeof body.code !== "string" || !verifyAccessCode(role.data, body.code)) {
    return NextResponse.json({ error: "Peran atau kode akses tidak valid." }, { status: 401 });
  }
  const token = await createSessionToken(role.data);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 60 * 60 * 8, path: "/" });
  return response;
}

