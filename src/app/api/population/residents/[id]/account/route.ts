import { randomInt } from "node:crypto";
import { NextResponse } from "next/server";
import { hashMemberPin,requestSession } from "@/lib/auth";
import { getLocation,getSql } from "@/lib/db";

function category(birthDate:string){const age=Math.floor((Date.now()-new Date(birthDate).getTime())/31557600000);return age<13?"elementary":age<16?"junior_high":age<19?"senior_high":"adult";}

export async function POST(request:Request,context:RouteContext<"/api/population/residents/[id]/account">){
  const session=await requestSession(request,["operator","admin"]); if(!session)return NextResponse.json({error:"Tidak berwenang"},{status:401});
  const {id}=await context.params; const location=await getLocation(); if(!location)return NextResponse.json({error:"Lokasi belum tersedia"},{status:503});
  const sql=getSql();
  const [resident]=await sql`SELECT r.id,r.full_name,r.birth_date,h.rt,h.rw,h.village
    FROM residents r JOIN households h ON h.id=r.household_id
    WHERE r.id=${id} AND r.location_id=${location.id} AND r.active=true`;
  if(!resident)return NextResponse.json({error:"Data penduduk tidak ditemukan."},{status:404});
  const [existing]=await sql`SELECT member_code FROM members WHERE resident_id=${id}`;
  if(existing)return NextResponse.json({error:`Akun ${existing.member_code} sudah tersedia.`},{status:409});
  const memberCode=`RT-${Date.now().toString(36).toUpperCase()}`; const accessPin=randomInt(0,1_000_000).toString().padStart(6,"0");
  const area=`RT ${resident.rt}/RW ${resident.rw}, ${resident.village}`;
  const [member]=await sql`INSERT INTO members(location_id,member_code,name,participant_category,rt,rw,village,area,account_type,benefit_mode,resident_id)
    VALUES(${location.id},${memberCode},${resident.full_name},${category(String(resident.birth_date))},${resident.rt},${resident.rw},${resident.village},${area},'individual','individual_balance',${id})
    RETURNING id,member_code,name`;
  await sql`INSERT INTO member_credentials(member_id,pin_hash) VALUES(${member.id},${hashMemberPin(accessPin)})`;
  await sql`INSERT INTO audit_logs(location_id,actor,action,entity_type,entity_id,after_data)
    VALUES(${location.id},${session.role},'resident.account.create','member',${member.id},${JSON.stringify({residentId:id,memberCode})}::jsonb)`;
  return NextResponse.json({...member,accessPin},{status:201});
}
