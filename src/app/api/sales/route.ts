import { NextResponse } from "next/server";
import { requestSession } from "@/lib/auth";
import { getLocation, getSql } from "@/lib/db";
import { saleSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const session = await requestSession(request, ["treasurer", "admin"]);
  if (!session) return NextResponse.json({ error: "Tidak berwenang" }, { status: 401 });
  const parsed = saleSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  const sql = getSql(); const location = await getLocation(); const d = parsed.data;
  try {
    const [row] = await sql`SELECT record_pet_sale(${location!.id}, ${d.buyerName}, ${d.weightKg}, ${d.pricePerKg}, ${d.transportCost}, ${session.role}) AS id`;
    return NextResponse.json(row, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Penjualan gagal" }, { status: 400 }); }
}

