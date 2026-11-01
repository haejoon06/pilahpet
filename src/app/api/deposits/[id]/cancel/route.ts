import { NextResponse } from "next/server";
import { requestSession } from "@/lib/auth";
import { getLocation, getSql } from "@/lib/db";
import { cancelDepositSchema } from "@/lib/validation";

export async function POST(request: Request, context: RouteContext<"/api/deposits/[id]/cancel">) {
  const session = await requestSession(request, ["operator", "admin"]);
  if (!session) return NextResponse.json({ error: "Tidak berwenang" }, { status: 401 });
  const parsed = cancelDepositSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  const { id } = await context.params; const sql = getSql(); const location = await getLocation();
  try {
    const [row] = await sql`SELECT cancel_pet_deposit(${location!.id}, ${id}, ${parsed.data.reason}, ${session.role}) AS id`;
    return NextResponse.json(row);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Pembatalan gagal" }, { status: 400 });
  }
}
