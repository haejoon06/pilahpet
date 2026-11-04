import { NextResponse } from "next/server";
import { requestSession } from "@/lib/auth";
import { getLocation,getSql } from "@/lib/db";
import { letterReviewSchema } from "@/lib/validation";

export async function PATCH(request:Request,context:RouteContext<"/api/letters/[id]">){
  const session=await requestSession(request,["operator","admin"]);if(!session)return NextResponse.json({error:"Tidak berwenang"},{status:401});
  const parsed=letterReviewSchema.safeParse(await request.json().catch(()=>({})));if(!parsed.success)return NextResponse.json({error:parsed.error.issues[0]?.message},{status:400});
  const {id}=await context.params;const location=await getLocation();if(!location)return NextResponse.json({error:"Lokasi belum tersedia"},{status:503});
  const data=parsed.data;const status=data.action==="approve"?"approved":"rejected";const sql=getSql();
  if(data.action==="approve"&&(!location.rt_number||!location.rw_number||!location.village||!location.address||!location.chairperson_name)){
    return NextResponse.json({error:"Lengkapi RT, RW, desa, alamat sekretariat, dan nama Ketua RT pada menu Pengaturan RT sebelum menyetujui surat."},{status:400});
  }
  let row:Record<string,unknown>|undefined;
  try{
    if(data.action==="approve"){
      [row]=await sql`SELECT * FROM approve_letter_request(${id},${location.id},${session.role},${data.notes||null},${data.letterNumber||null})`;
    }else{
      [row]=await sql`UPDATE letter_requests SET status='rejected',letter_number=null,notes=${data.notes||null},reviewed_by=${session.role},reviewed_at=now(),updated_at=now()
        WHERE id=${id} AND location_id=${location.id} AND status='pending' RETURNING id,status,letter_number`;
    }
  }catch(error){
    const dbError=error as {code?:string;message?:string};
    if(dbError.code==="P0001"||dbError.message?.includes("LETTER_ALREADY_PROCESSED"))return NextResponse.json({error:"Pengajuan tidak ditemukan atau sudah diproses."},{status:409});
    throw error;
  }
  if(!row)return NextResponse.json({error:"Pengajuan tidak ditemukan atau sudah diproses."},{status:409});
  await sql`INSERT INTO audit_logs(location_id,actor,action,entity_type,entity_id,after_data)
    VALUES(${location.id},${session.role},${data.action==="approve"?'letter.approve':'letter.reject'},'letter_request',${id},${JSON.stringify({status,letterNumber:row.letter_number??null})}::jsonb)`;
  return NextResponse.json(row);
}
