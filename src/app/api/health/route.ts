import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";

export async function GET() {
  try { const sql = getSql(); await sql`SELECT 1 AS ok`; return NextResponse.json({ status: "ok", database: "connected", sensorIntegration: "disabled" }); }
  catch (error) { return NextResponse.json({ status: "degraded", database: error instanceof Error ? error.message : "unavailable" }, { status: 503 }); }
}

