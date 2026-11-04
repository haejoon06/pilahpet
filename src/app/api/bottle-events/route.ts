import { NextResponse } from "next/server";
import { requestSession } from "@/lib/auth";
import { createBottleEvent } from "@/lib/bottle-events";
import { getLocation,getSql } from "@/lib/db";
import { bottleEventSchema } from "@/lib/validation";

export async function GET(request:Request){
  const session=await requestSession(request,["operator","treasurer","supervisor","admin"]);
  if(!session) return NextResponse.json({error:"Tidak berwenang"},{status:401});
  const location=await getLocation(); if(!location) return NextResponse.json({error:"Lokasi belum tersedia"},{status:503});
  const sql=getSql();
  await sql`UPDATE bottle_events SET status='expired' WHERE location_id=${location.id} AND status='available' AND expires_at<now()`;
  const rows=await sql`SELECT be.id,be.claim_token,be.device_code,be.bottle_count,be.weight_kg::float8,
    be.voucher_amount::float8,be.status,be.expires_at,be.created_at,m.name AS claimed_by_name
    FROM bottle_events be LEFT JOIN members m ON m.id=be.claimed_by
    WHERE be.location_id=${location.id} ORDER BY be.created_at DESC LIMIT 100`;
  return NextResponse.json(rows);
}

export async function POST(request:Request){
  const session=await requestSession(request,["operator","admin"]);
  if(!session) return NextResponse.json({error:"Tidak berwenang"},{status:401});
  const parsed=bottleEventSchema.safeParse(await request.json().catch(()=>({})));
  if(!parsed.success) return NextResponse.json({error:parsed.error.issues[0]?.message},{status:400});
  const event=await createBottleEvent(parsed.data,new URL(request.url).origin);
  const location=await getLocation(); const sql=getSql();
  await sql`INSERT INTO audit_logs(location_id,actor,action,entity_type,entity_id,after_data)
    VALUES(${location!.id},${session.role},'bottle_event.simulate','bottle_event',${event.id},${JSON.stringify({deviceCode:parsed.data.deviceCode,bottleCount:parsed.data.bottleCount,weightKg:parsed.data.weightKg})}::jsonb)`;
  return NextResponse.json(event,{status:201});
}
