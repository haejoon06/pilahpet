"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { Role } from "@/lib/auth";

type Member = {id:string;member_code:string;name:string;area:string;benefit_mode:string};
type Deposit = {id:string;member_name:string;net_weight_kg:number;total_value:number;confirmed_at:string};

export default function OperatorConsole({role,members,deposits}:{role:Role;members:Member[];deposits:Deposit[]}) {
  const router = useRouter(); const [message,setMessage] = useState("");
  const canOperate = role === "operator" || role === "admin"; const canFinance = role === "treasurer" || role === "admin";
  async function send(event:FormEvent<HTMLFormElement>, url:string) {
    event.preventDefault(); setMessage("Menyimpan…"); const form=event.currentTarget; const data=Object.fromEntries(new FormData(form));
    if(url==="/api/deposits") { data.clientTransactionId=crypto.randomUUID(); localStorage.setItem("sipilah-deposit-draft",JSON.stringify(data)); }
    const response=await fetch(url,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(data)}); const result=await response.json();
    if(!response.ok) return setMessage(result.error ?? "Data belum dapat disimpan.");
    if(url==="/api/deposits") localStorage.removeItem("sipilah-deposit-draft"); form.reset(); setMessage("Data berhasil disimpan."); router.refresh();
  }

  return <div className="console-grid">
    {message && <p className="message panel full" role="status">{message}</p>}
    {canOperate && <section className="panel"><h2>Daftarkan anggota</h2><form className="form" onSubmit={(e)=>send(e,"/api/members")}>
      <div className="inline"><div className="field"><label>Nama</label><input name="name" required minLength={2}/></div><div className="field"><label>Wilayah</label><input name="area" required/></div></div>
      <div className="field"><label>Kontak opsional</label><input name="phone"/></div><div className="inline"><div className="field"><label>Jenis akun</label><select name="accountType"><option value="individual">Individu</option><option value="group">Kelompok</option></select></div><div className="field"><label>Model manfaat</label><select name="benefitMode"><option value="individual_balance">Saldo individu</option><option value="group_cash">Kas kelompok</option></select></div></div><button className="button dark">Simpan anggota</button>
    </form></section>}
    {canOperate && <section className="panel"><h2>Catat setoran PET</h2><form className="form" onSubmit={(e)=>send(e,"/api/deposits")}>
      <div className="field"><label>Anggota</label><select name="memberId" required defaultValue=""><option value="" disabled>Pilih anggota</option>{members.map(m=><option value={m.id} key={m.id}>{m.member_code} — {m.name}</option>)}</select></div>
      <div className="inline"><div className="field"><label>Berat bruto (kg)</label><input name="grossKg" type="number" step="0.001" min="0.001" required/></div><div className="field"><label>Tara (kg)</label><input name="tareKg" type="number" step="0.001" min="0" defaultValue="0" required/></div></div><button className="button dark">Konfirmasi setoran</button>
    </form></section>}
    {canFinance && <section className="panel"><h2>Tetapkan harga</h2><form className="form" onSubmit={(e)=>send(e,"/api/prices")}><div className="field"><label>Harga PET per kg (Rp)</label><input name="pricePerKg" type="number" min="0" required/></div><button className="button dark">Aktifkan harga baru</button></form></section>}
    {canFinance && <section className="panel"><h2>Catat penjualan</h2><form className="form" onSubmit={(e)=>send(e,"/api/sales")}><div className="field"><label>Nama pengepul</label><input name="buyerName" required/></div><div className="inline"><div className="field"><label>Berat (kg)</label><input name="weightKg" type="number" step="0.001" min="0.001" required/></div><div className="field"><label>Harga/kg (Rp)</label><input name="pricePerKg" type="number" min="0" required/></div></div><div className="field"><label>Biaya angkut (Rp)</label><input name="transportCost" type="number" min="0" defaultValue="0" required/></div><button className="button dark">Simpan penjualan</button></form></section>}
    <section className="panel full"><h2>Setoran terakhir</h2><div className="table-wrap"><table className="data-table"><thead><tr><th>Waktu</th><th>Anggota</th><th>Berat</th><th>Nilai</th></tr></thead><tbody>{deposits.length ? deposits.map(d=><tr key={d.id}><td>{new Date(d.confirmed_at).toLocaleString("id-ID")}</td><td>{d.member_name}</td><td>{Number(d.net_weight_kg).toFixed(3)} kg</td><td>{new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(d.total_value)}</td></tr>) : <tr><td colSpan={4}>Belum ada setoran.</td></tr>}</tbody></table></div></section>
  </div>;
}
