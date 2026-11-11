import { NextResponse } from "next/server";
import { requestSession } from "@/lib/auth";
import { getLocation,getSql } from "@/lib/db";
import { rtOfficialSchema } from "@/lib/validation";

export async function GET(request:Request){
  const session=await requestSession(request,["chairperson","admin"]);
  if(!session)return NextResponse.json({error:"Tidak berwenang"},{status:401});
  const location=await getLocation();
  if(!location)return NextResponse.json({error:"Lokasi belum tersedia"},{status:503});
  const sql=getSql();
  const rows=await sql`SELECT id,position,full_name,start_date,end_date,phone,notes,
    (start_date<=current_date AND (end_date IS NULL OR end_date>=current_date)) AS current
    FROM rt_officials WHERE location_id=${location.id}
    ORDER BY current DESC,start_date DESC,position,full_name`;
  return NextResponse.json(rows);
}

export async function POST(request:Request){
  const session=await requestSession(request,["chairperson","admin"]);
  if(!session)return NextResponse.json({error:"Tidak berwenang"},{status:401});
  const parsed=rtOfficialSchema.safeParse(await request.json().catch(()=>({})));
  if(!parsed.success)return NextResponse.json({error:parsed.error.issues[0]?.message},{status:400});
  const location=await getLocation();
  if(!location)return NextResponse.json({error:"Lokasi belum tersedia"},{status:503});
  const data=parsed.data;
  const sql=getSql();
  const [overlap]=await sql`SELECT id FROM rt_officials WHERE location_id=${location.id} AND position=${data.position}
    AND daterange(start_date,COALESCE(end_date,'infinity'::date),'[]') &&
      daterange(${data.startDate}::date,COALESCE(${data.endDate||null}::date,'infinity'::date),'[]') LIMIT 1`;
  if(overlap)return NextResponse.json({error:"Periode jabatan bertumpang tindih dengan pengurus pada posisi yang sama."},{status:409});
  const [row]=await sql`INSERT INTO rt_officials(location_id,position,full_name,start_date,end_date,phone,notes,created_by)
    VALUES(${location.id},${data.position},${data.fullName},${data.startDate},${data.endDate||null},${data.phone||null},${data.notes||null},${session.role})
    RETURNING id,position,full_name,start_date,end_date,phone,notes,
      (start_date<=current_date AND (end_date IS NULL OR end_date>=current_date)) AS current`;
  await sql`INSERT INTO audit_logs(location_id,actor,action,entity_type,entity_id,after_data)
    VALUES(${location.id},${session.role},'rt_official.create','rt_official',${row.id},${JSON.stringify(data)}::jsonb)`;
  return NextResponse.json(row,{status:201});
}
