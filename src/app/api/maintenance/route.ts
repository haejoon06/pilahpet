import { NextResponse } from "next/server";
import { requestSession } from "@/lib/auth";
import { getLocation, getSql } from "@/lib/db";
import { maintenanceSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const session = await requestSession(request, ["operator", "admin"]);
  if (!session) return NextResponse.json({ error: "Tidak berwenang" }, { status: 401 });
  const parsed = maintenanceSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  const sql = getSql(); const location = await getLocation(); const data = parsed.data;
  const [row] = await sql`INSERT INTO maintenance_logs(location_id, inspection_type, finding, action_taken, critical, inspected_by)
    VALUES(${location!.id}, ${data.inspectionType}, ${data.finding || null}, ${data.actionTaken || null}, ${data.critical}, ${data.inspectedBy})
    RETURNING id, inspection_type, critical, inspected_at`;
  await sql`INSERT INTO audit_logs(location_id, actor, action, entity_type, entity_id, after_data)
    VALUES(${location!.id}, ${session.role}, 'maintenance.create', 'maintenance_log', ${row.id}, ${JSON.stringify(row)}::jsonb)`;
  return NextResponse.json(row, { status: 201 });
}
