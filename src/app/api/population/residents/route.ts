import { NextResponse } from "next/server";
import { requestSession } from "@/lib/auth";
import { getLocation, getSql } from "@/lib/db";
import { encryptIdentityNumber, identityBlindIndex, lastFour } from "@/lib/pii";
import { residentSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const session = await requestSession(request, ["secretary", "admin"]);
  if (!session) return NextResponse.json({ error: "Tidak berwenang" }, { status: 401 });
  const parsed = residentSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  const location = await getLocation();
  if (!location) return NextResponse.json({ error: "Lokasi layanan belum tersedia." }, { status: 503 });
  const data = parsed.data; const sql = getSql();
  const [household] = await sql`SELECT id FROM households WHERE id = ${data.householdId} AND location_id = ${location.id}`;
  if (!household) return NextResponse.json({ error: "Data keluarga tidak ditemukan." }, { status: 404 });

  try {
    const [row] = await sql`INSERT INTO residents(
      location_id, household_id, nik_encrypted, nik_hash, nik_last4, full_name, gender,
      birth_place, birth_date, religion, education, occupation, blood_type, marital_status,
      marriage_date, family_relationship, citizenship, father_name, mother_name, created_by
    ) VALUES(
      ${location.id}, ${data.householdId}, ${encryptIdentityNumber(data.nik)}, ${identityBlindIndex(data.nik)},
      ${lastFour(data.nik)}, ${data.fullName}, ${data.gender}, ${data.birthPlace}, ${data.birthDate},
      ${data.religion}, ${data.education}, ${data.occupation}, ${data.bloodType}, ${data.maritalStatus},
      ${data.marriageDate || null}, ${data.familyRelationship}, ${data.citizenship},
      ${data.fatherName || null}, ${data.motherName || null}, ${session.role}
    ) RETURNING id, full_name, household_id`;
    await sql`INSERT INTO audit_logs(location_id, actor, action, entity_type, entity_id, after_data)
      VALUES(${location.id}, ${session.role}, 'resident.create', 'resident', ${row.id},
        ${JSON.stringify({ householdId: data.householdId, fullName: data.fullName, relationship: data.familyRelationship })}::jsonb)`;
    return NextResponse.json(row, { status: 201 });
  } catch (error) {
    const dbError = error as { code?: string };
    if (dbError.code === "23505") return NextResponse.json({ error: "NIK sudah terdaftar." }, { status: 409 });
    if (error instanceof Error && error.message === "PII_ENCRYPTION_NOT_CONFIGURED") {
      return NextResponse.json({ error: "Enkripsi data kependudukan belum dikonfigurasi." }, { status: 503 });
    }
    throw error;
  }
}
