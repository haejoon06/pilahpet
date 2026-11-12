import { NextResponse } from "next/server";
import { requestSession } from "@/lib/auth";
import { getLocation, getSql } from "@/lib/db";
import { deathFundSchema } from "@/lib/validation";

export async function GET(request:Request){
  const session=await requestSession(request,["chairperson","treasurer","admin"]);
  if(!session) return NextResponse.json({error:"Tidak berwenang"},{status:401});
  const location=await getLocation(); if(!location) return NextResponse.json({error:"Lokasi belum tersedia"},{status:503});
  const sql=getSql();
  const entries=await sql`SELECT d.id,d.entry_type,d.resident_id,d.contribution_month,d.deceased_name,d.recipient_name,
    d.description,d.amount::float8,d.transaction_date,d.created_by,d.created_at,r.full_name AS resident_name
    FROM death_fund_entries d LEFT JOIN residents r ON r.id=d.resident_id
    WHERE d.location_id=${location.id} ORDER BY d.transaction_date DESC,d.created_at DESC LIMIT 500`;
  const [summary]=await sql`SELECT
    COALESCE(sum(CASE WHEN entry_type='contribution' THEN amount ELSE 0 END),0)::float8 AS contributions,
    COALESCE(sum(CASE WHEN entry_type='benefit' THEN amount ELSE 0 END),0)::float8 AS benefits,
    COALESCE(sum(CASE WHEN entry_type='contribution' THEN amount ELSE -amount END),0)::float8 AS balance,
    COALESCE(sum(CASE WHEN entry_type='contribution' AND contribution_month=date_trunc('month',current_date)::date THEN amount ELSE 0 END),0)::float8 AS current_month
    FROM death_fund_entries WHERE location_id=${location.id}`;
  const residents=await sql`SELECT r.id,r.full_name,h.head_name
    FROM residents r JOIN households h ON h.id=r.household_id
    WHERE h.location_id=${location.id} AND r.active=true
    ORDER BY r.full_name`;
  return NextResponse.json({entries,summary,residents});
}

export async function POST(request:Request){
  const session=await requestSession(request,["treasurer","admin"]);
  if(!session) return NextResponse.json({error:"Hanya Bendahara dan Admin yang dapat mengelola Dana Kematian."},{status:401});
  const parsed=deathFundSchema.safeParse(await request.json().catch(()=>({})));
  if(!parsed.success) return NextResponse.json({error:parsed.error.issues[0]?.message},{status:400});
  const location=await getLocation(); if(!location) return NextResponse.json({error:"Lokasi belum tersedia"},{status:503});
  const data=parsed.data; const sql=getSql();
  if(data.entryType==="contribution"){
    const [resident]=await sql`SELECT r.id FROM residents r JOIN households h ON h.id=r.household_id
      WHERE r.id=${data.residentId||null} AND h.location_id=${location.id} AND r.active=true`;
    if(!resident)return NextResponse.json({error:"Data warga pembayar tidak ditemukan."},{status:404});
  }
  let row;
  if(data.entryType==="benefit"){
    [row]=await sql`INSERT INTO death_fund_entries(location_id,entry_type,deceased_name,recipient_name,description,amount,transaction_date,created_by)
      SELECT ${location.id},'benefit',${data.deceasedName||null},${data.recipientName||null},${data.description||null},${data.amount},${data.transactionDate},${session.role}
      WHERE ${data.amount} <= (SELECT COALESCE(sum(CASE WHEN entry_type='contribution' THEN amount ELSE -amount END),0) FROM death_fund_entries WHERE location_id=${location.id})
      RETURNING id,entry_type,deceased_name,recipient_name,description,amount::float8,transaction_date`;
    if(!row)return NextResponse.json({error:"Saldo Dana Kematian tidak mencukupi untuk santunan tersebut."},{status:400});
  }else{
    const contributionDate=`${data.contributionMonth}-01`;
    [row]=await sql`INSERT INTO death_fund_entries(location_id,entry_type,resident_id,contribution_month,description,amount,transaction_date,created_by)
      VALUES(${location.id},'contribution',${data.residentId||null},${contributionDate},${data.description||null},${data.amount},${data.transactionDate},${session.role})
      RETURNING id,entry_type,resident_id,contribution_month,description,amount::float8,transaction_date`;
  }
  await sql`INSERT INTO audit_logs(location_id,actor,action,entity_type,entity_id,after_data)
    VALUES(${location.id},${session.role},'death_fund.create','death_fund_entry',${row.id},${JSON.stringify({entryType:data.entryType,amount:data.amount,residentId:data.residentId||null,deceasedName:data.deceasedName||null})}::jsonb)`;
  return NextResponse.json(row,{status:201});
}
