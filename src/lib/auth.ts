import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE = "pilahpet_session";
export const MEMBER_SESSION_COOKIE = "pilahpet_member_session";
export type Role = "operator" | "treasurer" | "supervisor" | "admin";
export type StaffSession = { kind: "staff"; role: Role; issuedAt: number };
export type MemberSession = { kind: "member"; memberId: string; issuedAt: number };
export type Session = StaffSession | MemberSession;

const roleCodes: Record<Role, string | undefined> = {
  operator: process.env.OPERATOR_ACCESS_CODE,
  treasurer: process.env.TREASURER_ACCESS_CODE,
  supervisor: process.env.SUPERVISOR_ACCESS_CODE,
  admin: process.env.ADMIN_ACCESS_CODE,
};

function key() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) return null;
  return new TextEncoder().encode(secret);
}

export function authConfigured() {
  return Boolean(key() && Object.values(roleCodes).some(Boolean));
}

export function verifyAccessCode(role: Role, code: string) {
  const expected = roleCodes[role];
  if (!expected) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(code);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function createSessionToken(role: Role) {
  const secret = key();
  if (!secret) throw new Error("AUTH_NOT_CONFIGURED");
  return new SignJWT({ kind: "staff", role, issuedAt: Date.now() }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("8h").sign(secret);
}

export async function createMemberSessionToken(memberId: string) {
  const secret = key();
  if (!secret) throw new Error("AUTH_NOT_CONFIGURED");
  return new SignJWT({ kind: "member", memberId, issuedAt: Date.now() }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("8h").sign(secret);
}

export function hashMemberPin(pin: string) {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("AUTH_NOT_CONFIGURED");
  return createHmac("sha256", secret).update(pin).digest("hex");
}

export async function readSession(token?: string | null): Promise<Session | null> {
  const secret = key();
  if (!secret || !token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    if (payload.kind === "member" && typeof payload.memberId === "string") {
      return { kind: "member", memberId: payload.memberId, issuedAt: Number(payload.issuedAt ?? 0) };
    }
    const role = payload.role as Role;
    if (!role || !["operator", "treasurer", "supervisor", "admin"].includes(role)) return null;
    return { kind: "staff", role, issuedAt: Number(payload.issuedAt ?? 0) };
  } catch { return null; }
}

export async function pageSession() {
  const jar = await cookies();
  return readSession(jar.get(SESSION_COOKIE)?.value);
}

export async function requirePageSession() {
  const session = await pageSession();
  if (!session || session.kind !== "staff") redirect("/login");
  return session;
}

export async function requireMemberPageSession() {
  const jar = await cookies();
  const session = await readSession(jar.get(MEMBER_SESSION_COOKIE)?.value);
  if (!session || session.kind !== "member") redirect("/anggota/masuk");
  return session;
}

export async function requestSession(request: Request, allowed: Role[]) {
  const cookie = request.headers.get("cookie") ?? "";
  const token = cookie.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${SESSION_COOKIE}=`))?.split("=")[1];
  const session = await readSession(token);
  return session?.kind === "staff" && allowed.includes(session.role) ? session : null;
}

