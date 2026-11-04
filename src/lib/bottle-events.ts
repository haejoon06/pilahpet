import "server-only";
import { randomBytes } from "node:crypto";
import QRCode from "qrcode";
import { getLocation,getSql } from "@/lib/db";

export async function createBottleEvent(data:{deviceCode:string;bottleCount:number;weightKg:number},origin:string){
  const location=await getLocation(); if(!location) throw new Error("LOCATION_NOT_CONFIGURED");
  const token=randomBytes(18).toString("base64url");
  const rate=Number(process.env.VOUCHER_RATE_PER_KG||2000);
  const voucherAmount=Math.round(data.weightKg*rate);
  const sql=getSql();
  const [row]=await sql`INSERT INTO bottle_events(location_id,claim_token,device_code,bottle_count,weight_kg,voucher_amount,expires_at)
    VALUES(${location.id},${token},${data.deviceCode},${data.bottleCount},${data.weightKg},${voucherAmount},now()+interval '15 minutes')
    RETURNING id,claim_token,device_code,bottle_count,weight_kg::float8,voucher_amount::float8,status,expires_at,created_at`;
  const claimUrl=`${origin}/klaim/${token}`;
  const qrDataUrl=await QRCode.toDataURL(claimUrl,{width:320,margin:2,errorCorrectionLevel:"M"});
  return {...row,claimUrl,qrDataUrl} as {id:string;claim_token:string;device_code:string;bottle_count:number;weight_kg:number;voucher_amount:number;status:string;expires_at:string;created_at:string;claimUrl:string;qrDataUrl:string};
}
