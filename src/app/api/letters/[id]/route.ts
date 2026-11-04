import { NextResponse } from "next/server";
import { requestSession } from "@/lib/auth";
import { getLocation,getSql } from "@/lib/db";
import { letterReviewSchema } from "@/lib/validation";

export async function PATCH(request:Request,context:RouteContext<"/api/letters/[id]">){
  const session=await requestSession(request,["operator","admin"]);if(!session)return NextResponse.json({error:"Tidak berwenang"},{status:401});
  const parsed=letterReviewSchema.safeParse(await request.json().catch(()=>({})));if(!parsed.success)return NextResponse.json({error:parsed.error.issues[0]?.message},{status:400});
  const {id}=await context.params;const location=await getLocation();if(!location)return NextResponse.json({error:"Lokasi belum tersedia"},{status:503});
  const data=parsed.data;const status=data.action==="approve"?"approved":"rejected";const sql=getSql();
  const [row]=await sql`UPDATE letter_requests SET status=${status},letter_number=${data.action==="approve"?(data.letterNumber||`RT/${new Date().getFullYear()}/${Date.now().toString().slice(-6)}`):null},notes=${data.notes||null},reviewed_by=${session.role},reviewed_at=now(),updated_at=now()
    WHERE id=${id} AND location_id=${location.id} AND status='pending' RETURNING id,status,letter_number`;
  if(!row)return NextResponse.json({error:"Pengajuan tidak ditemukan atau sudah diproses."},{status:409});
  await sql`INSERT INTO audit_logs(location_id,actor,action,entity_type,entity_id,after_data)
    VALUES(${location.id},${session.role},${data.action==="approve"?'letter.approve':'letter.reject'},'letter_request',${id},${JSON.stringify({status,letterNumber:row.letter_number})}::jsonb)`;
  return NextResponse.json(row);
}
