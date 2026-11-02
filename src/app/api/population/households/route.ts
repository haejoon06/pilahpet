import { NextResponse } from "next/server";
import { requestSession } from "@/lib/auth";
import { getLocation, getSql } from "@/lib/db";
import { encryptIdentityNumber, identityBlindIndex, lastFour, maskedIdentity } from "@/lib/pii";
import { householdSchema } from "@/lib/validation";

const validRegion = (value: string) => /^\d{1,3}$/.test(value);

export async function GET(request: Request) {
  const session = await requestSession(request, ["operator", "supervisor", "admin"]);
  if (!session) return NextResponse.json({ error: "Tidak berwenang" }, { status: 401 });
  const location = await getLocation();
  if (!location) return NextResponse.json({ error: "Lokasi layanan belum tersedia." }, { status: 503 });

  const url = new URL(request.url);
  const rt = url.searchParams.get("rt")?.trim() ?? "";
  const rw = url.searchParams.get("rw")?.trim() ?? "";
  if ((rt && !validRegion(rt)) || (rw && !validRegion(rw))) {
    return NextResponse.json({ error: "RT dan RW harus berupa 1–3 angka." }, { status: 400 });
  }

  const sql = getSql();
  const households = await sql`SELECT id, family_card_number_last4, head_name, address, rt, rw,
    postal_code, village, subdistrict, regency, province, issued_at, created_at
    FROM households
    WHERE location_id = ${location.id}
      AND (${rt || null}::text IS NULL OR rt = ${rt || null})
      AND (${rw || null}::text IS NULL OR rw = ${rw || null})
    ORDER BY rt, rw, head_name LIMIT 200`;

  const residents = await sql`SELECT r.id, r.household_id, r.nik_last4, r.full_name, r.gender,
    r.birth_place, r.birth_date, r.religion, r.education, r.occupation, r.blood_type,
    r.marital_status, r.marriage_date, r.family_relationship, r.citizenship,
    r.father_name, r.mother_name
    FROM residents r JOIN households h ON h.id = r.household_id
    WHERE r.location_id = ${location.id} AND r.active = true
      AND (${rt || null}::text IS NULL OR h.rt = ${rt || null})
      AND (${rw || null}::text IS NULL OR h.rw = ${rw || null})
    ORDER BY r.full_name LIMIT 1000`;

  const membersByHousehold = new Map<string, unknown[]>();
  for (const resident of residents) {
    const householdId = String(resident.household_id);
    const list = membersByHousehold.get(householdId) ?? [];
    list.push({ ...resident, nik_masked: maskedIdentity(String(resident.nik_last4)), nik_last4: undefined });
    membersByHousehold.set(householdId, list);
  }

  return NextResponse.json(households.map((household) => ({
    ...household,
    family_card_number_masked: maskedIdentity(String(household.family_card_number_last4)),
    family_card_number_last4: undefined,
    residents: membersByHousehold.get(String(household.id)) ?? [],
  })));
}

export async function POST(request: Request) {
  const session = await requestSession(request, ["operator", "admin"]);
  if (!session) return NextResponse.json({ error: "Tidak berwenang" }, { status: 401 });
  const parsed = householdSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  const location = await getLocation();
  if (!location) return NextResponse.json({ error: "Lokasi layanan belum tersedia." }, { status: 503 });
  const data = parsed.data; const sql = getSql();

  try {
    const [row] = await sql`INSERT INTO households(
      location_id, family_card_number_encrypted, family_card_number_hash, family_card_number_last4,
      head_name, address, rt, rw, postal_code, village, subdistrict, regency, province, issued_at, created_by
    ) VALUES(
      ${location.id}, ${encryptIdentityNumber(data.familyCardNumber)}, ${identityBlindIndex(data.familyCardNumber)},
      ${lastFour(data.familyCardNumber)}, ${data.headName}, ${data.address}, ${data.rt}, ${data.rw},
      ${data.postalCode || null}, ${data.village}, ${data.subdistrict}, ${data.regency}, ${data.province},
      ${data.issuedAt || null}, ${session.role}
    ) RETURNING id, head_name, rt, rw, village`;
    await sql`INSERT INTO audit_logs(location_id, actor, action, entity_type, entity_id, after_data)
      VALUES(${location.id}, ${session.role}, 'household.create', 'household', ${row.id},
        ${JSON.stringify({ headName: data.headName, rt: data.rt, rw: data.rw, village: data.village })}::jsonb)`;
    return NextResponse.json(row, { status: 201 });
  } catch (error) {
    const dbError = error as { code?: string };
    if (dbError.code === "23505") return NextResponse.json({ error: "Nomor KK sudah terdaftar." }, { status: 409 });
    if (error instanceof Error && error.message === "PII_ENCRYPTION_NOT_CONFIGURED") {
      return NextResponse.json({ error: "Enkripsi data kependudukan belum dikonfigurasi." }, { status: 503 });
    }
    throw error;
  }
}
