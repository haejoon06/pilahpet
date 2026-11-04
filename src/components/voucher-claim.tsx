"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const rupiah=(value:number)=>new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(value);

export default function VoucherClaim({token}:{token:string}){
  const [message,setMessage]=useState(""); const [busy,setBusy]=useState(false); const router=useRouter();
  async function claim(){setBusy(true);setMessage("");const response=await fetch("/api/vouchers/claim",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({token})});const body=await response.json();setBusy(false);if(!response.ok)return setMessage(body.error??"Voucher belum dapat diklaim.");router.push(`/warga/voucher?claimed=${encodeURIComponent(rupiah(body.amount))}`);}
  return <div className="claim-actions"><button className="button dark" onClick={claim} disabled={busy}>{busy?"Memproses…":"Klaim voucher"}</button>{message&&<p className={`message ${message.startsWith("Berhasil")?"success":"error"}`}>{message}</p>}</div>;
}
