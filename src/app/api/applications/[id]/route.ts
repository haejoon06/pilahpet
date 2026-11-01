import { randomInt } from "node:crypto";
import { NextResponse } from "next/server";
import { hashMemberPin, requestSession } from "@/lib/auth";
import { getLocation, getSql } from "@/lib/db";
import { applicationReviewSchema } from "@/lib/validation";

export async function PATCH(request: Request, context: RouteContext<"/api/applications/[id]">) {
  const session = await requestSession(request, ["operator", "admin"]);
  if (!session) return NextResponse.json({ error: "Tidak berwenang" }, { status: 401 });
  const parsed = applicationReviewSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  const { id } = await context.params;
  const sql = getSql(); const location = await getLocation();
  const [application] = await sql`SELECT * FROM member_applications WHERE id = ${id} AND location_id = ${location!.id} FOR UPDATE`;
  if (!application) return NextResponse.json({ error: "Pendaftaran tidak ditemukan." }, { status: 404 });
  if (application.status !== "pending") return NextResponse.json({ error: "Pendaftaran sudah ditinjau." }, { status: 409 });

  if (parsed.data.action === "reject") {
    const [row] = await sql`UPDATE member_applications SET status = 'rejected', notes = ${parsed.data.notes || null},
      reviewed_by = ${session.role}, reviewed_at = now() WHERE id = ${id} RETURNING id, status`;
    await sql`INSERT INTO audit_logs(location_id, actor, action, entity_type, entity_id, after_data)
      VALUES(${location!.id}, ${session.role}, 'application.reject', 'member_application', ${id}, ${JSON.stringify({ notes: parsed.data.notes || null })}::jsonb)`;
    return NextResponse.json(row);
  }

  const memberCode = `PET-${Date.now().toString(36).toUpperCase()}`;
  const accessPin = randomInt(0, 1_000_000).toString().padStart(6, "0");
  const [member] = await sql`INSERT INTO members(location_id, member_code, name, area, phone, account_type, benefit_mode)
    VALUES(${location!.id}, ${memberCode}, ${application.name}, ${application.area}, ${application.phone},
      ${application.account_type}, ${application.benefit_mode}) RETURNING id, member_code, name`;
  await sql`INSERT INTO member_credentials(member_id, pin_hash) VALUES(${member.id}, ${hashMemberPin(accessPin)})`;
  await sql`UPDATE member_applications SET status = 'approved', member_id = ${member.id}, notes = ${parsed.data.notes || null},
    reviewed_by = ${session.role}, reviewed_at = now() WHERE id = ${id}`;
  await sql`INSERT INTO audit_logs(location_id, actor, action, entity_type, entity_id, after_data)
    VALUES(${location!.id}, ${session.role}, 'application.approve', 'member_application', ${id},
      ${JSON.stringify({ memberId: member.id, memberCode: member.member_code })}::jsonb)`;
  return NextResponse.json({ ...member, accessPin });
}
