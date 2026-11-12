import { NextResponse } from "next/server";
import { requestSession } from "@/lib/auth";

export async function POST(request:Request){
  const session=await requestSession(request,["chairperson","admin"]);
  if(!session)return NextResponse.json({error:"Tidak berwenang"},{status:401});
  return NextResponse.json({error:"Identitas RT telah diverifikasi dan dikunci. Perubahan wilayah hanya dapat dilakukan melalui pembaruan sistem oleh administrator."},{status:409});
}
