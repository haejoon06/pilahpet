import { NextResponse } from "next/server";
import { requestSession } from "@/lib/auth";
import { getLocation, getSql } from "@/lib/db";
import { rtCashSchema } from "@/lib/validation";

export async function GET(request:Request){
  const session=await requestSession(request,["chairperson","treasurer","admin"]);
  if(!session) return NextResponse.json({error:"Tidak berwenang"},{status:401});
  const location=await getLocation(); if(!location) return NextResponse.json({error:"Lokasi belum tersedia"},{status:503});
  const sql=getSql();
  const entries=await sql`SELECT id,entry_type,category,description,amount::float8,transaction_date,created_by,created_at
    FROM rt_cash_entries WHERE location_id=${location.id} ORDER BY transaction_date DESC,created_at DESC LIMIT 500`;
  const [summary]=await sql`SELECT
    COALESCE(sum(CASE WHEN entry_type='income' THEN amount ELSE 0 END),0)::float8 AS income,
    COALESCE(sum(CASE WHEN entry_type='expense' THEN amount ELSE 0 END),0)::float8 AS expense,
    COALESCE(sum(CASE WHEN entry_type='income' THEN amount ELSE -amount END),0)::float8 AS balance
    FROM rt_cash_entries WHERE location_id=${location.id}`;
  return NextResponse.json({entries,summary});
}

export async function POST(request:Request){
  const session=await requestSession(request,["treasurer","admin"]);
  if(!session) return NextResponse.json({error:"Hanya Bendahara dan Admin yang dapat mengelola kas."},{status:401});
  const parsed=rtCashSchema.safeParse(await request.json().catch(()=>({})));
  if(!parsed.success) return NextResponse.json({error:parsed.error.issues[0]?.message},{status:400});
  const location=await getLocation(); if(!location) return NextResponse.json({error:"Lokasi belum tersedia"},{status:503});
  const data=parsed.data; const sql=getSql();
  const [row]=await sql`INSERT INTO rt_cash_entries(location_id,entry_type,category,description,amount,transaction_date,created_by)
    VALUES(${location.id},${data.entryType},${data.category},${data.description},${data.amount},${data.transactionDate},${session.role})
    RETURNING id,entry_type,category,description,amount::float8,transaction_date`;
  await sql`INSERT INTO audit_logs(location_id,actor,action,entity_type,entity_id,after_data)
    VALUES(${location.id},${session.role},'rt_cash.create','rt_cash_entry',${row.id},${JSON.stringify({entryType:data.entryType,category:data.category,amount:data.amount})}::jsonb)`;
  return NextResponse.json(row,{status:201});
}
