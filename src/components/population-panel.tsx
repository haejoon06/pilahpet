"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import type { Role } from "@/lib/auth";

type Resident = {
  id:string; nik_masked:string; full_name:string; gender:"male"|"female"; birth_place:string;
  birth_date:string; religion:string; education:string; occupation:string; blood_type:string;
  marital_status:string; marriage_date?:string|null; family_relationship:string; citizenship:string;
  father_name?:string|null; mother_name?:string|null; member_code?:string|null;
};
type Household = {
  id:string; family_card_number_masked:string; head_name:string; address:string; rt:string; rw:string;
  postal_code?:string|null; village:string; subdistrict:string; regency:string; province:string;
  created_at:string; residents:Resident[];
};
type RegionIdentity={rt_number:string|null;rw_number:string|null;village:string|null;subdistrict:string|null;regency:string|null;province:string|null;postal_code:string|null};

const displayDate = (value?:string|null) => {
  if(!value) return "—";
  const normalized=/^\d{4}-\d{2}-\d{2}$/.test(value)?`${value}T00:00:00Z`:value;
  const date=new Date(normalized);
  return Number.isNaN(date.getTime())?"—":new Intl.DateTimeFormat("id-ID",{dateStyle:"medium",timeZone:"Asia/Jakarta"}).format(date);
};
const displayDateTime = (value:string) => new Intl.DateTimeFormat("id-ID", { dateStyle:"long", timeStyle:"short", timeZone:"Asia/Jakarta" }).format(new Date(value));
const currentYear = new Date().getFullYear();
const days = Array.from({length:31},(_,index)=>index+1);
const months = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
const years = Array.from({length:currentYear-1899},(_,index)=>currentYear-index);
const educationOptions = [
  "Tidak/Belum Sekolah","Belum Tamat SD/Sederajat","Tamat SD/Sederajat","SLTP/Sederajat",
  "SLTA/Sederajat","Diploma I/II","Akademi/Diploma III/Sarjana Muda","Diploma IV/Strata I","Strata II","Strata III",
];
const occupationOptions = [
  "Belum/Tidak Bekerja","Mengurus Rumah Tangga","Pelajar/Mahasiswa","Pensiunan","Pegawai Negeri Sipil",
  "Tentara Nasional Indonesia","Kepolisian RI","Perdagangan","Petani/Pekebun","Peternak","Nelayan/Perikanan",
  "Industri","Konstruksi","Transportasi","Karyawan Swasta","Karyawan BUMN","Karyawan BUMD","Karyawan Honorer",
  "Buruh Harian Lepas","Buruh Tani/Perkebunan","Wiraswasta","Guru","Dosen","Dokter","Perawat","Bidan",
  "Sopir","Pedagang","Mekanik","Seniman","Wartawan","Tokoh Agama","Lainnya",
];

export default function PopulationPanel({ role }:{ role:Role }) {
  const canManage = role === "secretary" || role === "admin";
  const [households,setHouseholds] = useState<Household[]>([]);
  const [loading,setLoading] = useState(true);
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState("");
  const [error,setError] = useState(false);
  const [region,setRegion] = useState<RegionIdentity|null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(false);
    const response = await fetch("/api/population/households");
    const body = await response.json().catch(() => []); setLoading(false);
    if(!response.ok) { setError(true); setMessage(body.error ?? "Data kependudukan belum dapat dimuat."); return; }
    setHouseholds(body);
  },[]);

  useEffect(() => {
    let active=true;
    Promise.all([fetch("/api/population/households"),fetch("/api/settings/location")]).then(async([response,locationResponse])=>({
      response,body:await response.json().catch(()=>[]),locationResponse,locationBody:await locationResponse.json().catch(()=>null),
    })).then(({response,body,locationResponse,locationBody})=>{
      if(!active) return;
      setLoading(false);
      if(!response.ok) { setError(true); setMessage(body.error??"Data kependudukan belum dapat dimuat."); return; }
      setHouseholds(body);
      if(locationResponse.ok)setRegion(locationBody);
    });
    return()=>{active=false;};
  },[]);

  async function submit(event:FormEvent<HTMLFormElement>,url:string,success:string) {
    event.preventDefault(); setBusy(true); setError(false); setMessage("Menyimpan data terenkripsi…");
    const form=event.currentTarget; const data=Object.fromEntries(new FormData(form));
    if(url.endsWith("/households")){
      if(!region?.rt_number||!region.rw_number||!region.village||!region.subdistrict||!region.regency||!region.province||!region.postal_code){
        setBusy(false);setError(true);setMessage("Identitas resmi RT belum tersedia. Hubungi administrator sistem.");return;
      }
      data.rt=region.rt_number;data.rw=region.rw_number;data.village=region.village;data.subdistrict=region.subdistrict;
      data.regency=region.regency;data.province=region.province;data.postalCode=region.postal_code;
    }
    if(url.endsWith("/residents")) {
      const year=String(data.birthYear); const month=String(data.birthMonth).padStart(2,"0"); const day=String(data.birthDay).padStart(2,"0");
      const birthDate=`${year}-${month}-${day}`; const parsedDate=new Date(`${birthDate}T00:00:00Z`);
      const validDate=parsedDate.getUTCFullYear()===Number(year)&&parsedDate.getUTCMonth()+1===Number(month)&&parsedDate.getUTCDate()===Number(day);
      if(!validDate) { setBusy(false); setError(true); setMessage("Tanggal lahir tidak valid. Periksa kembali tanggal, bulan, dan tahun."); return; }
      data.birthDate=birthDate; delete data.birthDay; delete data.birthMonth; delete data.birthYear;
    }
    const response=await fetch(url,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(data)});
    const body=await response.json().catch(()=>({})); setBusy(false);
    if(!response.ok) { setError(true); setMessage(body.error??"Data belum dapat disimpan."); return; }
    setMessage(success); form.reset(); await load();
  }
  async function createResidentAccount(resident:Resident){
    if(!window.confirm(`Buat akun warga untuk ${resident.full_name}?`))return;
    setBusy(true);setError(false);setMessage("Membuat akun warga…");
    const response=await fetch(`/api/population/residents/${resident.id}/account`,{method:"POST"});const body=await response.json();setBusy(false);
    if(!response.ok){setError(true);setMessage(body.error??"Akun belum dapat dibuat.");return;}
    setMessage(`Akun berhasil dibuat. Kode: ${body.member_code}. PIN awal: ${body.accessPin}. Catat dan berikan langsung kepada warga.`);await load();
  }

  const identityReady=Boolean(region?.rt_number&&region.rw_number&&region.village&&region.subdistrict&&region.regency&&region.province&&region.postal_code);

  return <div className="population-stack">
    <section className="privacy-banner"><div><strong>Data pribadi dilindungi</strong><p>Nomor KK dan NIK dienkripsi sebelum disimpan serta hanya ditampilkan dalam bentuk tersamarkan. Jangan mengunggah foto KK ke halaman publik.</p></div><span>AKSES TERBATAS</span></section>
    {message&&<p className={`message ${error?"error":"success"}`} role="status">{message}</p>}

    {canManage&&!identityReady&&<div className="empty-state">Identitas wilayah sistem belum tersedia. Minta Ketua RT atau Admin menyinkronkan wilayah pada menu Pengaturan RT sebelum menambah keluarga.</div>}
    {canManage&&identityReady&&<div className="console-grid">
      <section className="panel"><h2>Tambah Data Kartu Keluarga (KK)</h2><p className="subtle">RT/RW dan wilayah diisi otomatis dari identitas sistem. Sekretaris hanya memasukkan nomor KK, kepala keluarga, dan alamat rumah.</p><form className="form" onSubmit={(event)=>submit(event,"/api/population/households","Data Kartu Keluarga berhasil disimpan.")}>
        <div className="inline"><div className="field"><label htmlFor="kk-number">Nomor KK</label><input id="kk-number" name="familyCardNumber" inputMode="numeric" pattern="[0-9]{16}" maxLength={16} autoComplete="off" required/><small className="field-hint">16 digit, akan disimpan terenkripsi.</small></div><div className="field"><label htmlFor="head-name">Nama kepala keluarga</label><input id="head-name" name="headName" required/></div></div>
        <div className="field"><label htmlFor="family-address">Alamat</label><textarea id="family-address" name="address" rows={2} required/></div>
        <div className="letter-requirements"><strong>Wilayah otomatis</strong><div><span>RT {region?.rt_number}/RW {region?.rw_number}</span><span>{region?.village}</span><span>{region?.subdistrict}</span><span>{region?.regency}</span><span>{region?.province} {region?.postal_code}</span></div><small>Data ini dikunci untuk seluruh keluarga pada RT yang sama.</small></div>
        <div className="field"><label htmlFor="input-date">Tanggal Penginputan</label><input id="input-date" value={new Intl.DateTimeFormat("id-ID",{dateStyle:"long",timeZone:"Asia/Jakarta"}).format(new Date())} readOnly aria-readonly="true"/><small className="field-hint">Tanggal tersimpan otomatis saat data KK disimpan.</small></div>
        <button className="button dark" disabled={busy}>Simpan Data Kartu Keluarga</button>
      </form></section>

      <section className="panel"><h2>Tambah anggota keluarga</h2><p className="subtle">Pilih keluarga yang sudah disimpan, kemudian isi data penduduk.</p>{households.length?<form className="form" onSubmit={(event)=>submit(event,"/api/population/residents","Data penduduk berhasil disimpan.")}>
        <div className="field"><label htmlFor="resident-household">Keluarga</label><select id="resident-household" name="householdId" required defaultValue=""><option value="" disabled>Pilih keluarga</option>{households.map((item)=><option value={item.id} key={item.id}>RT {item.rt}/RW {item.rw} — {item.head_name}</option>)}</select></div>
        <div className="inline"><div className="field"><label htmlFor="resident-nik">NIK</label><input id="resident-nik" name="nik" inputMode="numeric" pattern="[0-9]{16}" maxLength={16} autoComplete="off" required/><small className="field-hint">16 digit, akan disimpan terenkripsi.</small></div><div className="field"><label htmlFor="resident-name">Nama lengkap</label><input id="resident-name" name="fullName" required/></div></div>
        <div className="inline"><div className="field"><label htmlFor="gender">Jenis kelamin</label><select id="gender" name="gender"><option value="male">Laki-laki</option><option value="female">Perempuan</option></select></div><div className="field"><label htmlFor="relationship">Hubungan dalam keluarga</label><select id="relationship" name="familyRelationship"><option>Kepala Keluarga</option><option>Suami</option><option>Istri</option><option>Anak</option><option>Famili Lain</option><option>Lainnya</option></select></div></div>
        <div className="inline birth-row"><div className="field"><label htmlFor="birth-place">Tempat lahir</label><input id="birth-place" name="birthPlace" required/></div><fieldset className="field date-select-field"><legend>Tanggal lahir</legend><div className="date-select-grid"><div><label htmlFor="birth-day">Tanggal</label><select id="birth-day" name="birthDay" required defaultValue=""><option value="" disabled>--</option>{days.map(day=><option key={day} value={day}>{day}</option>)}</select></div><div><label htmlFor="birth-month">Bulan</label><select id="birth-month" name="birthMonth" required defaultValue=""><option value="" disabled>--</option>{months.map((month,index)=><option key={month} value={index+1}>{month}</option>)}</select></div><div><label htmlFor="birth-year">Tahun</label><select id="birth-year" name="birthYear" required defaultValue=""><option value="" disabled>--</option>{years.map(year=><option key={year} value={year}>{year}</option>)}</select></div></div><small className="field-hint">Pilihan tahun tersedia dari 1900 hingga {currentYear}.</small></fieldset></div>
        <div className="inline"><div className="field"><label htmlFor="religion">Agama</label><select id="religion" name="religion"><option>Islam</option><option>Kristen</option><option>Katolik</option><option>Hindu</option><option>Buddha</option><option>Khonghucu</option><option>Kepercayaan</option></select></div><div className="field"><label htmlFor="blood-type">Golongan darah</label><select id="blood-type" name="bloodType"><option value="unknown">Tidak tahu</option><option>A</option><option>B</option><option>AB</option><option>O</option></select></div></div>
        <div className="inline"><div className="field"><label htmlFor="education">Pendidikan</label><select id="education" name="education" required defaultValue=""><option value="" disabled>Pilih pendidikan</option>{educationOptions.map(option=><option key={option}>{option}</option>)}</select></div><div className="field"><label htmlFor="occupation">Jenis pekerjaan</label><select id="occupation" name="occupation" required defaultValue=""><option value="" disabled>Pilih pekerjaan</option>{occupationOptions.map(option=><option key={option}>{option}</option>)}</select></div></div>
        <div className="inline"><div className="field"><label htmlFor="marital-status">Status perkawinan</label><select id="marital-status" name="maritalStatus"><option>Belum Kawin</option><option>Kawin Tercatat</option><option>Kawin Belum Tercatat</option><option>Cerai Hidup</option><option>Cerai Mati</option></select></div><div className="field"><label htmlFor="marriage-date">Tanggal perkawinan <span className="optional">(opsional)</span></label><input id="marriage-date" name="marriageDate" type="date"/></div></div>
        <div className="inline"><div className="field"><label htmlFor="citizenship">Kewarganegaraan</label><select id="citizenship" name="citizenship"><option>WNI</option><option>WNA</option></select></div><div className="field"><label htmlFor="father-name">Nama ayah <span className="optional">(opsional)</span></label><input id="father-name" name="fatherName"/></div></div>
        <div className="field"><label htmlFor="mother-name">Nama ibu <span className="optional">(opsional)</span></label><input id="mother-name" name="motherName"/></div>
        <button className="button dark" disabled={busy}>Simpan anggota keluarga</button>
      </form>:<div className="empty-state">Simpan data keluarga terlebih dahulu.</div>}</section>
    </div>}

    <section className="panel"><div className="panel-head population-head"><div><h2>Daftar keluarga</h2><p className="subtle">Seluruh keluarga berada pada {region?.rt_number&&region?.rw_number?`RT ${region.rt_number}/RW ${region.rw_number}`:"wilayah RT yang sama"}.</p></div><span className="result-count">{households.length} keluarga</span></div>
      {loading?<div className="empty-state">Memuat data kependudukan…</div>:households.length?<div className="household-list">{households.map((household)=><article className="household-card" key={household.id}><header><div><span className="location-chip">RT {household.rt} / RW {household.rw}</span><h3>{household.head_name}</h3><p>KK {household.family_card_number_masked}</p></div><strong>{household.residents.length} anggota</strong></header><div className="household-address"><p>{household.address}</p><p>{household.village}, {household.subdistrict}, {household.regency}, {household.province} {household.postal_code??""}</p><small>Diinput: {displayDateTime(household.created_at)}</small></div>{household.residents.length?<div className="table-wrap"><table className="data-table resident-table"><thead><tr><th>Nama/NIK</th><th>L/P</th><th>Lahir</th><th>Hubungan</th><th>Pendidikan</th><th>Pekerjaan</th><th>Status</th><th>Akun warga</th></tr></thead><tbody>{household.residents.map((resident)=><tr key={resident.id}><td><strong>{resident.full_name}</strong><br/><span className="masked-id">{resident.nik_masked}</span></td><td>{resident.gender==="male"?"L":"P"}</td><td>{resident.birth_place}<br/>{displayDate(resident.birth_date)}</td><td>{resident.family_relationship}</td><td>{resident.education}</td><td>{resident.occupation}</td><td>{resident.marital_status}</td><td>{resident.member_code?<span className="status-pill approved">{resident.member_code}</span>:canManage?<button className="text-button" disabled={busy} onClick={()=>createResidentAccount(resident)}>Buat akun</button>:"Belum ada"}</td></tr>)}</tbody></table></div>:<div className="empty-inline">Belum ada anggota keluarga.</div>}</article>)}</div>:<div className="empty-state">Belum ada data keluarga.</div>}
    </section>
  </div>;
}
