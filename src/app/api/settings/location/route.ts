import { NextResponse } from "next/server";
import { requestSession } from "@/lib/auth";
import { getLocation } from "@/lib/db";

export async function GET(request:Request){
  const session=await requestSession(request,["chairperson","secretary","admin"]);
  if(!session)return NextResponse.json({error:"Tidak berwenang"},{status:401});
  return NextResponse.json(await getLocation());
}
