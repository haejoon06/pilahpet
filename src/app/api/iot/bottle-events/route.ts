import { createHash,timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createBottleEvent } from "@/lib/bottle-events";
import { bottleEventSchema } from "@/lib/validation";

function validKey(value:string|null){
  const expected=process.env.IOT_DEVICE_KEY; if(!expected||!value) return false;
  const a=createHash("sha256").update(expected).digest(); const b=createHash("sha256").update(value).digest();
  return timingSafeEqual(a,b);
}

export async function POST(request:Request){
  if(!validKey(request.headers.get("x-device-key"))) return NextResponse.json({error:"Perangkat tidak berwenang"},{status:401});
  const parsed=bottleEventSchema.safeParse(await request.json().catch(()=>({})));
  if(!parsed.success) return NextResponse.json({error:parsed.error.issues[0]?.message},{status:400});
  return NextResponse.json(await createBottleEvent(parsed.data,new URL(request.url).origin),{status:201});
}
