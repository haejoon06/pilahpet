import { NextResponse } from "next/server";
import { MEMBER_SESSION_COOKIE } from "@/lib/auth";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.set(MEMBER_SESSION_COOKIE, "", { httpOnly: true, maxAge: 0, path: "/" });
  return response;
}
