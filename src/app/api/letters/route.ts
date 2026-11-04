import { NextResponse } from "next/server";
import { requestMemberSession,requestSession } from "@/lib/auth";
import { getLocation,getSql } from "@/lib/db";
import { letterRequestSchema } from "@/lib/validation";

export async function GET(request:Request){
  const staff=await requestSession(request,["operator","supervisor","admin"]); const member=staff?null:await requestMemberSession(request);
  if(!staff&&!member)return NextResponse.json({error:"Tidak berwenang"},{status:401});
  const location=await getLocation(); if(!location)return NextResponse.json({error:"Lokasi belum tersedia"},{status:503});
  const sql=getSql();
  const rows=staff?await sql`SELECT lr.id,lr.letter_type,lr.purpose,lr.extra_data,lr.status,lr.letter_number,lr.notes,lr.created_at,lr.reviewed_at,m.name AS member_name,m.member_code
    FROM letter_requests lr JOIN members m ON m.id=lr.member_id WHERE lr.location_id=${location.id} ORDER BY lr.created_at DESC LIMIT 300`
    :await sql`SELECT id,letter_type,purpose,extra_data,status,letter_number,notes,created_at,reviewed_at FROM letter_requests WHERE member_id=${member!.memberId} ORDER BY created_at DESC LIMIT 100`;
  return NextResponse.json(rows);
}

export async function POST(request:Request){
  const member=await requestMemberSession(request); if(!member)return NextResponse.json({error:"Silakan masuk sebagai warga."},{status:401});
  const parsed=letterRequestSchema.safeParse(await request.json().catch(()=>({})));if(!parsed.success)return NextResponse.json({error:parsed.error.issues[0]?.message},{status:400});
  const location=await getLocation();if(!location)return NextResponse.json({error:"Lokasi belum tersedia"},{status:503});
  const data=parsed.data;const sql=getSql();const extra={businessName:data.businessName||null,businessAddress:data.businessAddress||null};
  const [row]=await sql`INSERT INTO letter_requests(location_id,member_id,letter_type,purpose,extra_data)
    VALUES(${location.id},${member.memberId},${data.letterType},${data.purpose},${JSON.stringify(extra)}::jsonb)
    RETURNING id,letter_type,status,created_at`;
  await sql`INSERT INTO audit_logs(location_id,actor,action,entity_type,entity_id,after_data)
    VALUES(${location.id},'member','letter.request','letter_request',${row.id},${JSON.stringify({memberId:member.memberId,letterType:data.letterType})}::jsonb)`;
  return NextResponse.json(row,{status:201});
}
