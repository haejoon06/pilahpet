import { NextResponse } from "next/server";
import { requestMemberSession } from "@/lib/auth";
import { getSql } from "@/lib/db";

export async function POST(request:Request){
  const session=await requestMemberSession(request);
  if(!session) return NextResponse.json({error:"Silakan masuk sebagai warga."},{status:401});
  const token=String((await request.json().catch(()=>({}))).token??"").trim();
  if(token.length<10) return NextResponse.json({error:"Token QR tidak valid."},{status:400});
  try{
    const sql=getSql(); const [row]=await sql`SELECT claim_bottle_voucher(${token},${session.memberId})::float8 AS amount`;
    return NextResponse.json({ok:true,amount:row.amount});
  }catch(error){
    return NextResponse.json({error:error instanceof Error?error.message:"Voucher belum dapat diklaim."},{status:409});
  }
}
