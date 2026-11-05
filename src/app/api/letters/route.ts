import { NextResponse } from "next/server";
import { requestMemberSession,requestSession } from "@/lib/auth";
import { getLocation,getSql } from "@/lib/db";
import { staffLetterRequestSchema } from "@/lib/validation";

export async function GET(request:Request){
  const staff=await requestSession(request,["operator","supervisor","admin"]);
  const member=staff?null:await requestMemberSession(request);
  if(!staff&&!member)return NextResponse.json({error:"Tidak berwenang"},{status:401});
  const location=await getLocation();
  if(!location)return NextResponse.json({error:"Lokasi belum tersedia"},{status:503});
  const sql=getSql();
  const rows=staff
    ?await sql`SELECT lr.id,lr.resident_id,lr.letter_type,lr.purpose,lr.extra_data,lr.status,lr.letter_number,lr.notes,
      lr.created_at,lr.reviewed_at,lr.reviewed_by,COALESCE(r.full_name,m.name) AS member_name,m.member_code,
      h.rt,h.rw,h.village
      FROM letter_requests lr
      LEFT JOIN members m ON m.id=lr.member_id
      LEFT JOIN residents r ON r.id=COALESCE(lr.resident_id,m.resident_id)
      LEFT JOIN households h ON h.id=r.household_id
      WHERE lr.location_id=${location.id}
      ORDER BY lr.created_at DESC LIMIT 300`
    :await sql`SELECT lr.id,lr.letter_type,lr.purpose,lr.extra_data,lr.status,lr.letter_number,lr.notes,
      lr.created_at,lr.reviewed_at,lr.reviewed_by
      FROM letter_requests lr
      WHERE lr.member_id=${member!.memberId}
        OR lr.resident_id=(SELECT resident_id FROM members WHERE id=${member!.memberId})
      ORDER BY lr.created_at DESC LIMIT 100`;
  return NextResponse.json(rows);
}

export async function POST(request:Request){
  const session=await requestSession(request,["operator","admin"]);
  if(!session)return NextResponse.json({error:"Pencatatan surat hanya dapat dilakukan oleh pengurus RT."},{status:401});
  const parsed=staffLetterRequestSchema.safeParse(await request.json().catch(()=>({})));
  if(!parsed.success)return NextResponse.json({error:parsed.error.issues[0]?.message},{status:400});
  const location=await getLocation();
  if(!location)return NextResponse.json({error:"Lokasi belum tersedia"},{status:503});
  if(!location.rt_number||!location.rw_number||!location.village||!location.address||!location.chairperson_name){
    return NextResponse.json({error:"Lengkapi RT, RW, desa, alamat sekretariat, dan nama Ketua RT pada menu Pengaturan RT sebelum membuat surat."},{status:400});
  }
  const data=parsed.data;
  const sql=getSql();
  const extra={
    businessName:data.businessName||null,businessAddress:data.businessAddress||null,
    partnerName:data.partnerName||null,destinationOffice:data.destinationOffice||null,
    eventName:data.eventName||null,eventDate:data.eventDate||null,eventTime:data.eventTime||null,eventPlace:data.eventPlace||null,
    deathDate:data.deathDate||null,deathPlace:data.deathPlace||null,causeOfDeath:data.causeOfDeath||null,
    lostItem:data.lostItem||null,incidentDate:data.incidentDate||null,incidentPlace:data.incidentPlace||null,
  };
  try{
    const [row]=await sql`SELECT * FROM create_letter_by_staff(
      ${location.id},${data.residentId},${data.letterType},${data.purpose},${JSON.stringify(extra)}::jsonb,
      ${session.role},${data.notes||null},${data.letterNumber||null}
    )`;
    await sql`INSERT INTO audit_logs(location_id,actor,action,entity_type,entity_id,after_data)
      VALUES(${location.id},${session.role},'letter.create_by_staff','letter_request',${row.id},
      ${JSON.stringify({residentId:data.residentId,letterType:data.letterType,letterNumber:row.letter_number})}::jsonb)`;
    return NextResponse.json(row,{status:201});
  }catch(error){
    const dbError=error as {code?:string;message?:string};
    if(dbError.code==="P0002"||dbError.message?.includes("RESIDENT_NOT_FOUND"))return NextResponse.json({error:"Data warga tidak ditemukan atau sudah tidak aktif."},{status:404});
    throw error;
  }
}
