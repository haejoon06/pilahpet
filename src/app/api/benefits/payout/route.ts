import { NextResponse } from "next/server";
import { requestSession } from "@/lib/auth";
import { getLocation, getSql } from "@/lib/db";
import { payoutSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const session = await requestSession(request, ["admin", "waste_manager"]);
  if (!session) return NextResponse.json({ error: "Tidak berwenang" }, { status: 401 });
  const parsed = payoutSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  const sql = getSql(); const location = await getLocation(); const data = parsed.data;
  try {
    const [row] = await sql`SELECT record_benefit_payout(${location!.id}, ${data.memberId}, ${data.amount}, ${data.notes || ""}, ${session.role}) AS id`;
    return NextResponse.json(row, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Pencairan gagal" }, { status: 400 });
  }
}
