"use client";
import { FormEvent,useEffect,useState } from "react";
import type { Role } from "@/lib/auth";

type Entry={
  id:string;entry_type:"contribution"|"benefit";resident_name?:string|null;contribution_month?:string|null;
  deceased_name?:string|null;recipient_name?:string|null;description?:string|null;amount:number;transaction_date:string;created_by:string;
};
type Resident={id:string;full_name:string;head_name:string};
type Summary={contributions:number;benefits:number;balance:number;current_month:number};
const rupiah=(value:number)=>new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(value);
const today=()=>new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Jakarta",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
const monthLabel=(value?:string|null)=>value?new Intl.DateTimeFormat("id-ID",{month:"long",year:"numeric",timeZone:"Asia/Jakarta"}).format(new Date(`${value.slice(0,7)}-01T00:00:00+07:00`)):"—";

export default function RtCashPanel({role}:{role:Role}){
  const [entries,setEntries]=useState<Entry[]>([]);
  const [residents,setResidents]=useState<Resident[]>([]);
  const [summary,setSummary]=useState<Summary>({contributions:0,benefits:0,balance:0,current_month:0});
  const [entryType,setEntryType]=useState<"contribution"|"benefit">("contribution");
  const [message,setMessage]=useState("");
  const [error,setError]=useState(false);
  const [busy,setBusy]=useState(false);
  const canManage=role==="treasurer"||role==="admin";

  async function load(){
    const response=await fetch("/api/rt-cash");const body=await response.json();
    if(response.ok){setEntries(body.entries);setSummary(body.summary);setResidents(body.residents);}
  }
  useEffect(()=>{let active=true;fetch("/api/rt-cash").then(async response=>({response,body:await response.json()})).then(({response,body})=>{if(active&&response.ok){setEntries(body.entries);setSummary(body.summary);setResidents(body.residents);}});return()=>{active=false;};},[]);

  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setBusy(true);setMessage("");setError(false);const form=event.currentTarget;
    const response=await fetch("/api/rt-cash",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(Object.fromEntries(new FormData(form)))});
    const body=await response.json().catch(()=>({}));setBusy(false);
    if(!response.ok){setError(true);setMessage(body.error??"Pencatatan Dana Kematian belum dapat disimpan.");return;}
    form.reset();setEntryType("contribution");setMessage(entryType==="contribution"?"Iuran bulanan berhasil dicatat.":"Penyaluran santunan berhasil dicatat.");await load();
  }

  return <div className="module-stack">
    <section className="admin-stats death-fund-stats">
      <div><span>Iuran bulan ini</span><strong>{rupiah(Number(summary.current_month))}</strong></div>
      <div><span>Total iuran</span><strong>{rupiah(Number(summary.contributions))}</strong></div>
      <div><span>Total santunan</span><strong>{rupiah(Number(summary.benefits))}</strong></div>
      <div><span>Saldo Dana Kematian</span><strong>{rupiah(Number(summary.balance))}</strong></div>
    </section>
    {message&&<p className={`message ${error?"error":"success"}`} role="status">{message}</p>}
    <div className="console-grid">
      {canManage&&<section className="panel"><h2>Catat Dana Kematian</h2><p className="subtle">Nominal iuran bulanan bebas. Santunan hanya dapat dicatat jika saldo mencukupi.</p>
        <form className="form" onSubmit={submit}>
          <div className="inline"><div className="field"><label htmlFor="fund-type">Jenis pencatatan</label><select id="fund-type" name="entryType" value={entryType} onChange={event=>setEntryType(event.target.value as "contribution"|"benefit")}><option value="contribution">Iuran bulanan warga</option><option value="benefit">Penyaluran santunan kematian</option></select></div><div className="field"><label htmlFor="fund-date">Tanggal transaksi</label><input id="fund-date" name="transactionDate" type="date" defaultValue={today()} required/></div></div>
          {entryType==="contribution"?<>
            <div className="field"><label htmlFor="fund-resident">Nama warga pembayar</label><select id="fund-resident" name="residentId" required defaultValue=""><option value="" disabled>Pilih warga</option>{residents.map(resident=><option value={resident.id} key={resident.id}>{resident.full_name} · KK {resident.head_name}</option>)}</select></div>
            <div className="inline"><div className="field"><label htmlFor="fund-month">Bulan iuran</label><input id="fund-month" name="contributionMonth" type="month" defaultValue={today().slice(0,7)} required/></div><div className="field"><label htmlFor="fund-amount">Nominal iuran</label><input id="fund-amount" name="amount" type="number" min="1" placeholder="Nominal bebas" required/></div></div>
          </>:<>
            <div className="inline"><div className="field"><label htmlFor="deceased-name">Nama warga yang meninggal</label><input id="deceased-name" name="deceasedName" required/></div><div className="field"><label htmlFor="recipient-name">Keluarga penerima santunan</label><input id="recipient-name" name="recipientName" required/></div></div>
            <div className="field"><label htmlFor="fund-amount">Nominal santunan</label><input id="fund-amount" name="amount" type="number" min="1" max={Math.max(0,Number(summary.balance))||undefined} required/><small className="field-hint">Saldo tersedia: {rupiah(Number(summary.balance))}</small></div>
          </>}
          <div className="field"><label htmlFor="fund-description">Keterangan <span className="optional">(opsional)</span></label><textarea id="fund-description" name="description" rows={3} placeholder={entryType==="contribution"?"Contoh: Iuran Dana Kematian":"Contoh: Santunan diserahkan kepada keluarga"}/></div>
          <button className="button dark" disabled={busy||residents.length===0&&entryType==="contribution"}>{busy?"Menyimpan…":entryType==="contribution"?"Simpan iuran":"Simpan santunan"}</button>
        </form>
      </section>}
      <section className={`panel ${canManage?"":"full"}`}><div className="panel-head"><div><h2>Riwayat Dana Kematian</h2><p className="subtle">Iuran bulanan dan penyaluran santunan tercatat dalam satu buku dana.</p></div><span className="result-count">{entries.length} transaksi</span></div><div className="table-wrap"><table className="data-table"><thead><tr><th>Tanggal</th><th>Jenis</th><th>Warga/Keluarga</th><th>Bulan/Keterangan</th><th>Nominal</th></tr></thead><tbody>{entries.length?entries.map(item=><tr key={item.id}><td>{new Date(`${item.transaction_date}T00:00:00+07:00`).toLocaleDateString("id-ID")}</td><td><span className={`status-pill ${item.entry_type==="contribution"?"approved":"rejected"}`}>{item.entry_type==="contribution"?"Iuran":"Santunan"}</span></td><td>{item.entry_type==="contribution"?item.resident_name:<>{item.deceased_name}<br/><small>Penerima: {item.recipient_name}</small></>}</td><td>{item.entry_type==="contribution"?monthLabel(item.contribution_month):item.description||"Penyaluran kepada keluarga"}{item.entry_type==="contribution"&&item.description&&<><br/><small>{item.description}</small></>}</td><td><strong>{item.entry_type==="benefit"?"− ":""}{rupiah(Number(item.amount))}</strong></td></tr>):<tr><td colSpan={5}>Belum ada iuran atau penyaluran santunan.</td></tr>}</tbody></table></div></section>
    </div>
  </div>;
}
