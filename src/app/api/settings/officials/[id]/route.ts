import { NextResponse } from "next/server";
import { requestSession } from "@/lib/auth";
import { getLocation,getSql } from "@/lib/db";
import { rtOfficialSchema } from "@/lib/validation";

export async function PATCH(request:Request,context:RouteContext<"/api/settings/officials/[id]">){
  const session=await requestSession(request,["chairperson","admin"]);
  if(!session)return NextResponse.json({error:"Tidak berwenang"},{status:401});
  const parsed=rtOfficialSchema.safeParse(await request.json().catch(()=>({})));
  if(!parsed.success)return NextResponse.json({error:parsed.error.issues[0]?.message},{status:400});
  const location=await getLocation();
  if(!location)return NextResponse.json({error:"Lokasi belum tersedia"},{status:503});
  const {id}=await context.params;
  const data=parsed.data;
  const sql=getSql();
  const [existing]=await sql`SELECT * FROM rt_officials WHERE id=${id} AND location_id=${location.id}`;
  if(!existing)return NextResponse.json({error:"Data pengurus tidak ditemukan."},{status:404});
  const [overlap]=await sql`SELECT id FROM rt_officials WHERE location_id=${location.id} AND position=${data.position} AND id<>${id}
    AND daterange(start_date,COALESCE(end_date,'infinity'::date),'[]') &&
      daterange(${data.startDate}::date,COALESCE(${data.endDate||null}::date,'infinity'::date),'[]') LIMIT 1`;
  if(overlap)return NextResponse.json({error:"Periode jabatan bertumpang tindih dengan pengurus pada posisi yang sama."},{status:409});
  const [row]=await sql`UPDATE rt_officials SET position=${data.position},full_name=${data.fullName},start_date=${data.startDate},
    end_date=${data.endDate||null},phone=${data.phone||null},notes=${data.notes||null},updated_at=now()
    WHERE id=${id} AND location_id=${location.id}
    RETURNING id,position,full_name,start_date,end_date,phone,notes,
      (start_date<=current_date AND (end_date IS NULL OR end_date>=current_date)) AS current`;
  await sql`INSERT INTO audit_logs(location_id,actor,action,entity_type,entity_id,before_data,after_data)
    VALUES(${location.id},${session.role},'rt_official.update','rt_official',${id},${JSON.stringify(existing)}::jsonb,${JSON.stringify(data)}::jsonb)`;
  return NextResponse.json(row);
}

export async function DELETE(request:Request,context:RouteContext<"/api/settings/officials/[id]">){
  const session=await requestSession(request,["chairperson","admin"]);
  if(!session)return NextResponse.json({error:"Tidak berwenang"},{status:401});
  const location=await getLocation();
  if(!location)return NextResponse.json({error:"Lokasi belum tersedia"},{status:503});
  const {id}=await context.params;
  const sql=getSql();
  const [row]=await sql`DELETE FROM rt_officials WHERE id=${id} AND location_id=${location.id} RETURNING *`;
  if(!row)return NextResponse.json({error:"Data pengurus tidak ditemukan."},{status:404});
  await sql`INSERT INTO audit_logs(location_id,actor,action,entity_type,entity_id,before_data)
    VALUES(${location.id},${session.role},'rt_official.delete','rt_official',${id},${JSON.stringify(row)}::jsonb)`;
  return NextResponse.json({ok:true});
}
