"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import type { Role } from "@/lib/auth";

type Resident = {
  id:string; nik_masked:string; full_name:string; gender:"male"|"female"; birth_place:string;
  birth_date:string; religion:string; education:string; occupation:string; blood_type:string;
  marital_status:string; marriage_date?:string|null; family_relationship:string; citizenship:string;
  father_name?:string|null; mother_name?:string|null;
};
type Household = {
  id:string; family_card_number_masked:string; head_name:string; address:string; rt:string; rw:string;
  postal_code?:string|null; village:string; subdistrict:string; regency:string; province:string;
  issued_at?:string|null; residents:Resident[];
};

const displayDate = (value?:string|null) => value ? new Date(`${value}T00:00:00`).toLocaleDateString("id-ID") : "—";

export default function PopulationPanel({ role }:{ role:Role }) {
  const canManage = role === "operator" || role === "admin";
  const [households,setHouseholds] = useState<Household[]>([]);
  const [loading,setLoading] = useState(true);
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState("");
  const [error,setError] = useState(false);
  const [searchRt,setSearchRt] = useState("");
  const [searchRw,setSearchRw] = useState("");

  const load = useCallback(async (rt="",rw="") => {
    setLoading(true); setError(false);
    const params = new URLSearchParams(); if(rt) params.set("rt",rt); if(rw) params.set("rw",rw);
    const response = await fetch(`/api/population/households?${params}`);
    const body = await response.json().catch(() => []); setLoading(false);
    if(!response.ok) { setError(true); setMessage(body.error ?? "Data kependudukan belum dapat dimuat."); return; }
    setHouseholds(body);
  },[]);

  useEffect(() => {
    let active=true;
    fetch("/api/population/households").then(async(response)=>({response,body:await response.json().catch(()=>[])})).then(({response,body})=>{
      if(!active) return;
      setLoading(false);
      if(!response.ok) { setError(true); setMessage(body.error??"Data kependudukan belum dapat dimuat."); return; }
      setHouseholds(body);
    });
    return()=>{active=false;};
  },[]);

  async function submit(event:FormEvent<HTMLFormElement>,url:string,success:string) {
    event.preventDefault(); setBusy(true); setError(false); setMessage("Menyimpan data terenkripsi…");
    const form=event.currentTarget; const data=Object.fromEntries(new FormData(form));
    const response=await fetch(url,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(data)});
    const body=await response.json().catch(()=>({})); setBusy(false);
    if(!response.ok) { setError(true); setMessage(body.error??"Data belum dapat disimpan."); return; }
    setMessage(success); form.reset(); await load(searchRt,searchRw);
  }

  async function search(event:FormEvent<HTMLFormElement>) { event.preventDefault(); setMessage(""); await load(searchRt,searchRw); }
  async function clearSearch() { setSearchRt(""); setSearchRw(""); setMessage(""); await load(); }

  return <div className="population-stack">
    <section className="privacy-banner"><div><strong>Data pribadi dilindungi</strong><p>Nomor KK dan NIK dienkripsi sebelum disimpan serta hanya ditampilkan dalam bentuk tersamarkan. Jangan mengunggah foto KK ke halaman publik.</p></div><span>AKSES TERBATAS</span></section>
    {message&&<p className={`message ${error?"error":"success"}`} role="status">{message}</p>}

    {canManage&&<div className="console-grid">
      <section className="panel"><h2>Tambah data keluarga</h2><p className="subtle">Data wilayah ini menjadi dasar pencarian RT dan RW.</p><form className="form" onSubmit={(event)=>submit(event,"/api/population/households","Data keluarga berhasil disimpan.")}>
        <div className="inline"><div className="field"><label htmlFor="kk-number">Nomor KK</label><input id="kk-number" name="familyCardNumber" inputMode="numeric" pattern="[0-9]{16}" maxLength={16} autoComplete="off" required/><small className="field-hint">16 digit, akan disimpan terenkripsi.</small></div><div className="field"><label htmlFor="head-name">Nama kepala keluarga</label><input id="head-name" name="headName" required/></div></div>
        <div className="field"><label htmlFor="family-address">Alamat</label><textarea id="family-address" name="address" rows={2} required/></div>
        <div className="address-grid"><div className="field"><label htmlFor="family-rt">RT</label><input id="family-rt" name="rt" inputMode="numeric" pattern="[0-9]{1,3}" required/></div><div className="field"><label htmlFor="family-rw">RW</label><input id="family-rw" name="rw" inputMode="numeric" pattern="[0-9]{1,3}" required/></div><div className="field"><label htmlFor="family-village">Desa/Kelurahan</label><input id="family-village" name="village" required/></div></div>
        <div className="inline"><div className="field"><label htmlFor="subdistrict">Kecamatan</label><input id="subdistrict" name="subdistrict" required/></div><div className="field"><label htmlFor="regency">Kabupaten/Kota</label><input id="regency" name="regency" required/></div></div>
        <div className="inline"><div className="field"><label htmlFor="province">Provinsi</label><input id="province" name="province" required/></div><div className="field"><label htmlFor="postal-code">Kode pos <span className="optional">(opsional)</span></label><input id="postal-code" name="postalCode" inputMode="numeric" pattern="[0-9]{5}" maxLength={5}/></div></div>
        <div className="field"><label htmlFor="issued-at">Tanggal diterbitkan <span className="optional">(opsional)</span></label><input id="issued-at" name="issuedAt" type="date"/></div>
        <button className="button dark" disabled={busy}>Simpan data keluarga</button>
      </form></section>

      <section className="panel"><h2>Tambah anggota keluarga</h2><p className="subtle">Pilih keluarga yang sudah disimpan, kemudian isi data penduduk.</p>{households.length?<form className="form" onSubmit={(event)=>submit(event,"/api/population/residents","Data penduduk berhasil disimpan.")}>
        <div className="field"><label htmlFor="resident-household">Keluarga</label><select id="resident-household" name="householdId" required defaultValue=""><option value="" disabled>Pilih keluarga</option>{households.map((item)=><option value={item.id} key={item.id}>RT {item.rt}/RW {item.rw} — {item.head_name}</option>)}</select></div>
        <div className="inline"><div className="field"><label htmlFor="resident-nik">NIK</label><input id="resident-nik" name="nik" inputMode="numeric" pattern="[0-9]{16}" maxLength={16} autoComplete="off" required/><small className="field-hint">16 digit, akan disimpan terenkripsi.</small></div><div className="field"><label htmlFor="resident-name">Nama lengkap</label><input id="resident-name" name="fullName" required/></div></div>
        <div className="inline"><div className="field"><label htmlFor="gender">Jenis kelamin</label><select id="gender" name="gender"><option value="male">Laki-laki</option><option value="female">Perempuan</option></select></div><div className="field"><label htmlFor="relationship">Hubungan dalam keluarga</label><select id="relationship" name="familyRelationship"><option>Kepala Keluarga</option><option>Suami</option><option>Istri</option><option>Anak</option><option>Famili Lain</option><option>Lainnya</option></select></div></div>
        <div className="inline"><div className="field"><label htmlFor="birth-place">Tempat lahir</label><input id="birth-place" name="birthPlace" required/></div><div className="field"><label htmlFor="birth-date">Tanggal lahir</label><input id="birth-date" name="birthDate" type="date" required/></div></div>
        <div className="inline"><div className="field"><label htmlFor="religion">Agama</label><select id="religion" name="religion"><option>Islam</option><option>Kristen</option><option>Katolik</option><option>Hindu</option><option>Buddha</option><option>Khonghucu</option><option>Kepercayaan</option></select></div><div className="field"><label htmlFor="blood-type">Golongan darah</label><select id="blood-type" name="bloodType"><option value="unknown">Tidak tahu</option><option>A</option><option>B</option><option>AB</option><option>O</option></select></div></div>
        <div className="inline"><div className="field"><label htmlFor="education">Pendidikan</label><input id="education" name="education" required/></div><div className="field"><label htmlFor="occupation">Jenis pekerjaan</label><input id="occupation" name="occupation" required/></div></div>
        <div className="inline"><div className="field"><label htmlFor="marital-status">Status perkawinan</label><select id="marital-status" name="maritalStatus"><option>Belum Kawin</option><option>Kawin Tercatat</option><option>Kawin Belum Tercatat</option><option>Cerai Hidup</option><option>Cerai Mati</option></select></div><div className="field"><label htmlFor="marriage-date">Tanggal perkawinan <span className="optional">(opsional)</span></label><input id="marriage-date" name="marriageDate" type="date"/></div></div>
        <div className="inline"><div className="field"><label htmlFor="citizenship">Kewarganegaraan</label><select id="citizenship" name="citizenship"><option>WNI</option><option>WNA</option></select></div><div className="field"><label htmlFor="father-name">Nama ayah <span className="optional">(opsional)</span></label><input id="father-name" name="fatherName"/></div></div>
        <div className="field"><label htmlFor="mother-name">Nama ibu <span className="optional">(opsional)</span></label><input id="mother-name" name="motherName"/></div>
        <button className="button dark" disabled={busy}>Simpan anggota keluarga</button>
      </form>:<div className="empty-state">Simpan data keluarga terlebih dahulu.</div>}</section>
    </div>}

    <section className="panel"><div className="panel-head population-head"><div><h2>Pencarian data RT/RW</h2><p className="subtle">Isi salah satu atau keduanya untuk menyaring keluarga secara tepat.</p></div><span className="result-count">{households.length} keluarga</span></div>
      <form className="population-search" onSubmit={search}><div className="field"><label htmlFor="search-rt">Cari RT</label><input id="search-rt" inputMode="numeric" pattern="[0-9]{1,3}" value={searchRt} onChange={(event)=>setSearchRt(event.target.value)} placeholder="Contoh: 002"/></div><div className="field"><label htmlFor="search-rw">Cari RW</label><input id="search-rw" inputMode="numeric" pattern="[0-9]{1,3}" value={searchRw} onChange={(event)=>setSearchRw(event.target.value)} placeholder="Contoh: 008"/></div><button className="button dark" disabled={loading}>Cari data</button><button className="button secondary" type="button" onClick={clearSearch} disabled={loading}>Tampilkan semua</button></form>
      {loading?<div className="empty-state">Memuat data kependudukan…</div>:households.length?<div className="household-list">{households.map((household)=><article className="household-card" key={household.id}><header><div><span className="location-chip">RT {household.rt} / RW {household.rw}</span><h3>{household.head_name}</h3><p>KK {household.family_card_number_masked}</p></div><strong>{household.residents.length} anggota</strong></header><div className="household-address"><p>{household.address}</p><p>{household.village}, {household.subdistrict}, {household.regency}, {household.province} {household.postal_code??""}</p>{household.issued_at&&<small>Diterbitkan: {displayDate(household.issued_at)}</small>}</div>{household.residents.length?<div className="table-wrap"><table className="data-table resident-table"><thead><tr><th>Nama/NIK</th><th>L/P</th><th>Lahir</th><th>Hubungan</th><th>Pendidikan</th><th>Pekerjaan</th><th>Status</th></tr></thead><tbody>{household.residents.map((resident)=><tr key={resident.id}><td><strong>{resident.full_name}</strong><br/><span className="masked-id">{resident.nik_masked}</span></td><td>{resident.gender==="male"?"L":"P"}</td><td>{resident.birth_place}<br/>{displayDate(resident.birth_date)}</td><td>{resident.family_relationship}</td><td>{resident.education}</td><td>{resident.occupation}</td><td>{resident.marital_status}</td></tr>)}</tbody></table></div>:<div className="empty-inline">Belum ada anggota keluarga.</div>}</article>)}</div>:<div className="empty-state">Tidak ada keluarga yang cocok dengan RT/RW tersebut.</div>}
    </section>
  </div>;
}
