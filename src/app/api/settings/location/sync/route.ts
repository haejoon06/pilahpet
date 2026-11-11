import { NextResponse } from "next/server";
import { requestSession } from "@/lib/auth";
import { getLocation,getSql } from "@/lib/db";

export async function POST(request:Request){
  const session=await requestSession(request,["chairperson","admin"]);
  if(!session)return NextResponse.json({error:"Tidak berwenang"},{status:401});
  const location=await getLocation();
  if(!location)return NextResponse.json({error:"Lokasi belum tersedia"},{status:503});
  const sql=getSql();
  const candidates=await sql`SELECT rt,rw,village,subdistrict,regency,postal_code,count(*)::int AS households
    FROM households WHERE location_id=${location.id}
    GROUP BY rt,rw,village,subdistrict,regency,postal_code ORDER BY households DESC`;
  if(!candidates.length)return NextResponse.json({error:"Belum ada data keluarga yang dapat dijadikan identitas wilayah."},{status:400});
  if(candidates.length>1)return NextResponse.json({
    error:"Ditemukan lebih dari satu kombinasi RT/RW dan wilayah pada data keluarga. Koreksi data kependudukan terlebih dahulu agar identitas sistem tidak salah."
  },{status:409});
  const identity=candidates[0];
  const address=`Sekretariat RT ${identity.rt}/RW ${identity.rw}, ${identity.village}, ${identity.subdistrict}, ${identity.regency}${identity.postal_code?` ${identity.postal_code}`:""}`;
  await sql`UPDATE locations SET name=${`RT ${identity.rt}/RW ${identity.rw} ${identity.village}`},
    rt_number=${identity.rt},rw_number=${identity.rw},village=${identity.village},subdistrict=${identity.subdistrict},
    regency=${identity.regency},postal_code=${identity.postal_code},address=${address} WHERE id=${location.id}`;
  await sql`INSERT INTO audit_logs(location_id,actor,action,entity_type,entity_id,after_data)
    VALUES(${location.id},${session.role},'location.sync_from_population','location',${location.id},
    ${JSON.stringify({rt:identity.rt,rw:identity.rw,village:identity.village,subdistrict:identity.subdistrict,regency:identity.regency,postalCode:identity.postal_code})}::jsonb)`;
  return NextResponse.json(await getLocation());
}
