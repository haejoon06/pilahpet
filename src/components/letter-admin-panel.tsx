"use client";

import { FormEvent,useEffect,useMemo,useState } from "react";
import type { Role } from "@/lib/auth";
import { letterDescriptions,letterLabels,letterRequirements,letterTypeOptions,type LetterType } from "@/lib/letters";

type LetterStatus="pending"|"approved"|"rejected";
type Letter={
  id:string;resident_id?:string|null;letter_type:string;purpose:string;extra_data?:Record<string,string|null>;
  status:LetterStatus;letter_number?:string|null;notes?:string|null;created_at:string;reviewed_at?:string|null;
  reviewed_by?:string|null;member_name:string;member_code?:string|null;rt?:string|null;rw?:string|null;village?:string|null;
};
type ResidentOption={id:string;full_name:string;nik_masked:string;rt:string;rw:string;head_name:string};
type HouseholdResponse={head_name:string;rt:string;rw:string;residents:Array<{id:string;full_name:string;nik_masked:string}>};
type ReviewState={item:Letter;action:"approve"|"reject"}|null;
type CreatedLetter={id:string;letter_number:string}|null;

const statusLabels:Record<LetterStatus,string>={pending:"Menunggu",approved:"Selesai",rejected:"Ditolak"};
const roleLabels:Record<string,string>={admin:"Administrator RT",operator:"Petugas RT",supervisor:"Pengawas"};
const formatDate=(value:string)=>new Intl.DateTimeFormat("id-ID",{dateStyle:"long",timeStyle:"short",timeZone:"Asia/Jakarta"}).format(new Date(value));

export default function LetterAdminPanel({role}:{role:Role}){
  const canManage=role==="admin"||role==="operator";
  const [items,setItems]=useState<Letter[]>([]);
  const [residents,setResidents]=useState<ResidentOption[]>([]);
  const [createType,setCreateType]=useState<LetterType>("introduction");
  const [createdLetter,setCreatedLetter]=useState<CreatedLetter>(null);
  const [message,setMessage]=useState("");
  const [isError,setIsError]=useState(false);
  const [busy,setBusy]=useState(false);
  const [search,setSearch]=useState("");
  const [statusFilter,setStatusFilter]=useState("all");
  const [typeFilter,setTypeFilter]=useState("all");
  const [reviewState,setReviewState]=useState<ReviewState>(null);

  async function loadLetters(){const response=await fetch("/api/letters");const body=await response.json().catch(()=>[]);if(response.ok)setItems(body);}
  async function loadResidents(){
    const response=await fetch("/api/population/households");const body=await response.json().catch(()=>[]);
    if(response.ok){
      const options=(body as HouseholdResponse[]).flatMap(household=>household.residents.map(resident=>({...resident,rt:household.rt,rw:household.rw,head_name:household.head_name})));
      setResidents(options.sort((a,b)=>a.full_name.localeCompare(b.full_name,"id-ID")));
    }
  }
  useEffect(()=>{let active=true;Promise.all([
    fetch("/api/letters").then(async response=>({kind:"letters",response,body:await response.json().catch(()=>[])})),
    fetch("/api/population/households").then(async response=>({kind:"residents",response,body:await response.json().catch(()=>[])})),
  ]).then(results=>{if(!active)return;for(const result of results){if(!result.response.ok)continue;if(result.kind==="letters")setItems(result.body as Letter[]);else{const options=(result.body as HouseholdResponse[]).flatMap(household=>household.residents.map(resident=>({...resident,rt:household.rt,rw:household.rw,head_name:household.head_name})));setResidents(options.sort((a,b)=>a.full_name.localeCompare(b.full_name,"id-ID")));}}});return()=>{active=false;};},[]);

  const counts=useMemo(()=>({pending:items.filter(item=>item.status==="pending").length,approved:items.filter(item=>item.status==="approved").length,rejected:items.filter(item=>item.status==="rejected").length}),[items]);
  const filtered=useMemo(()=>{
    const query=search.trim().toLocaleLowerCase("id-ID");
    return items.filter(item=>{
      const matchesStatus=statusFilter==="all"||item.status===statusFilter;
      const matchesType=typeFilter==="all"||item.letter_type===typeFilter;
      const haystack=`${item.member_name} ${item.member_code??""} ${item.purpose} ${item.letter_number??""}`.toLocaleLowerCase("id-ID");
      return matchesStatus&&matchesType&&(!query||haystack.includes(query));
    });
  },[items,search,statusFilter,typeFilter]);

  async function createLetter(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setBusy(true);setMessage("");setIsError(false);setCreatedLetter(null);
    const form=event.currentTarget;
    const response=await fetch("/api/letters",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(Object.fromEntries(new FormData(form)))});
    const body=await response.json().catch(()=>({}));setBusy(false);
    if(!response.ok){setIsError(true);setMessage(body.error??"Surat belum dapat dibuat.");return;}
    setCreatedLetter({id:body.id,letter_number:body.letter_number});
    setMessage(`Surat berhasil dicatat dengan nomor ${body.letter_number}. Dokumen Word siap diunduh dan dicetak.`);
    form.reset();setCreateType("introduction");await loadLetters();await loadResidents();
  }

  async function submitReview(event:FormEvent<HTMLFormElement>){
    event.preventDefault();if(!reviewState)return;setBusy(true);setMessage("");setIsError(false);
    const data=Object.fromEntries(new FormData(event.currentTarget));
    const response=await fetch(`/api/letters/${reviewState.item.id}`,{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({action:reviewState.action,letterNumber:data.letterNumber??"",notes:data.notes??""})});
    const body=await response.json().catch(()=>({}));setBusy(false);
    if(!response.ok){setIsError(true);setMessage(body.error??"Surat belum dapat diproses.");return;}
    setMessage(reviewState.action==="approve"?`Surat disetujui dengan nomor ${body.letter_number}. Dokumen Word siap diunduh.`:"Pengajuan surat ditolak.");setReviewState(null);await loadLetters();
  }

  return <div className="module-stack">
    {canManage&&<section className="panel letter-create-panel"><div className="panel-head"><div><p className="eyebrow green">PELAYANAN DI KANTOR RT</p><h2>Catat dan buat surat warga</h2><p className="subtle">Warga datang ke RT. Pengurus memilih data warga, memeriksa dokumen pendukung, lalu mencetak surat.</p></div><span className="result-count">{residents.length} warga</span></div>
      {message&&<p className={`message ${isError?"error":"success"}`} role="status">{message}</p>}
      {createdLetter&&<div className="letter-ready"><div><strong>Surat siap dicetak</strong><span>Nomor {createdLetter.letter_number}</span></div><a className="button dark" href={`/api/letters/${createdLetter.id}/docx`}>Unduh Word</a></div>}
      {residents.length?<form className="form letter-create-form" onSubmit={createLetter}>
        <div className="field wide"><label htmlFor="resident-id">Nama warga</label><select id="resident-id" name="residentId" required defaultValue=""><option value="" disabled>Pilih warga dari data kependudukan</option>{residents.map(resident=><option value={resident.id} key={resident.id}>{resident.full_name} · NIK {resident.nik_masked} · RT {resident.rt}/RW {resident.rw}</option>)}</select><small className="field-hint">Jika nama belum tersedia, tambahkan terlebih dahulu pada menu Data Kependudukan.</small></div>
        <div className="field"><label htmlFor="create-letter-type">Jenis surat</label><select id="create-letter-type" name="letterType" value={createType} onChange={event=>setCreateType(event.target.value as LetterType)}>{letterTypeOptions.map(([value,text])=><option value={value} key={value}>{text}</option>)}</select><small className="field-hint">{letterDescriptions[createType]}</small></div>
        <div className="field"><label htmlFor="create-letter-number">Nomor surat <span className="optional">(opsional)</span></label><input id="create-letter-number" name="letterNumber" placeholder="Kosongkan untuk nomor otomatis"/><small className="field-hint">Nomor otomatis dibuat berurutan berdasarkan jenis surat, RT/RW, bulan, dan tahun.</small></div>
        <div className="letter-requirements wide"><strong>Dokumen yang perlu diperiksa</strong><div>{letterRequirements[createType].map(item=><span key={item}>{item}</span>)}</div><small>Daftar ini panduan awal. Sesuaikan dengan ketentuan kelurahan atau instansi tujuan.</small></div>
        {createType==="business"&&<><div className="field"><label htmlFor="business-name">Nama usaha</label><input id="business-name" name="businessName" required/></div><div className="field"><label htmlFor="business-address">Alamat usaha</label><input id="business-address" name="businessAddress" required/></div></>}
        {createType==="marriage"&&<><div className="field"><label htmlFor="partner-name">Nama calon pasangan <span className="optional">(opsional)</span></label><input id="partner-name" name="partnerName"/></div><div className="field"><label htmlFor="destination-office">Kelurahan/KUA tujuan <span className="optional">(opsional)</span></label><input id="destination-office" name="destinationOffice"/></div></>}
        {createType==="crowd_permit"&&<><div className="field"><label htmlFor="event-name">Nama kegiatan</label><input id="event-name" name="eventName" required/></div><div className="field"><label htmlFor="event-date">Tanggal kegiatan</label><input id="event-date" name="eventDate" type="date" required/></div><div className="field"><label htmlFor="event-time">Waktu kegiatan <span className="optional">(opsional)</span></label><input id="event-time" name="eventTime" placeholder="Contoh: 08.00–22.00 WIB"/></div><div className="field"><label htmlFor="event-place">Tempat kegiatan</label><input id="event-place" name="eventPlace" required/></div></>}
        {createType==="death"&&<><div className="field"><label htmlFor="death-date">Tanggal meninggal</label><input id="death-date" name="deathDate" type="date" required/></div><div className="field"><label htmlFor="death-place">Tempat meninggal</label><input id="death-place" name="deathPlace" required/></div><div className="field wide"><label htmlFor="cause-of-death">Penyebab meninggal <span className="optional">(opsional, sesuai dokumen)</span></label><input id="cause-of-death" name="causeOfDeath"/></div></>}
        {createType==="loss"&&<><div className="field wide"><label htmlFor="lost-item">Barang atau dokumen yang hilang</label><input id="lost-item" name="lostItem" required/></div><div className="field"><label htmlFor="incident-date">Tanggal kehilangan</label><input id="incident-date" name="incidentDate" type="date" required/></div><div className="field"><label htmlFor="incident-place">Perkiraan tempat kehilangan</label><input id="incident-place" name="incidentPlace" required/></div></>}
        <div className="field wide"><label htmlFor="create-purpose">Keperluan surat</label><textarea id="create-purpose" name="purpose" rows={3} placeholder="Tuliskan keperluan surat secara jelas" required/></div>
        <div className="field wide"><label htmlFor="create-notes">Catatan administrasi <span className="optional">(opsional)</span></label><textarea id="create-notes" name="notes" rows={2} placeholder="Catatan internal pengurus RT"/></div>
        <button className="button dark wide" disabled={busy}>{busy?"Membuat surat…":"Simpan dan buat surat"}</button>
      </form>:<div className="empty-state">Belum ada warga dalam Data Kependudukan. Tambahkan data keluarga dan anggota keluarga terlebih dahulu.</div>}
    </section>}

    <section className="letter-admin-stats" aria-label="Ringkasan surat"><div><span>Proses lama</span><strong>{counts.pending}</strong></div><div><span>Surat selesai</span><strong>{counts.approved}</strong></div><div><span>Ditolak</span><strong>{counts.rejected}</strong></div><div><span>Jumlah pencatatan</span><strong>{items.length}</strong></div></section>

    {reviewState&&<section className="panel letter-review-panel"><div className="panel-head"><div><p className="eyebrow green">PENYELESAIAN DATA LAMA</p><h2>{reviewState.action==="approve"?"Setujui surat":"Tolak pengajuan"}</h2><p className="subtle">{letterLabels[reviewState.item.letter_type as LetterType]??reviewState.item.letter_type} untuk {reviewState.item.member_name}</p></div><button className="text-button" type="button" onClick={()=>setReviewState(null)}>Tutup</button></div><form className="form" onSubmit={submitReview}>{reviewState.action==="approve"&&<div className="field"><label htmlFor="letter-number">Nomor surat <span className="optional">(opsional)</span></label><input id="letter-number" name="letterNumber" placeholder="Kosongkan untuk nomor berurutan otomatis"/></div>}<div className="field"><label htmlFor="review-notes">{reviewState.action==="approve"?"Catatan pengurus (opsional)":"Alasan penolakan"}</label><textarea id="review-notes" name="notes" rows={3} required={reviewState.action==="reject"}/></div><div className="row-actions"><button className={`button dark ${reviewState.action==="reject"?"danger":""}`} disabled={busy}>{busy?"Memproses…":reviewState.action==="approve"?"Setujui dan buat nomor":"Tolak pengajuan"}</button><button className="button secondary" type="button" onClick={()=>setReviewState(null)} disabled={busy}>Batal</button></div></form></section>}

    <section className="panel"><div className="panel-head"><div><h2>Arsip surat warga</h2><p className="subtle">Cari, periksa, dan unduh kembali surat yang pernah dibuat pengurus RT.</p></div><span className="result-count">{filtered.length} surat</span></div>
      <div className="letter-filter-bar"><div className="field"><label htmlFor="letter-search">Cari warga atau nomor surat</label><input id="letter-search" value={search} onChange={event=>setSearch(event.target.value)} placeholder="Nama warga atau nomor surat"/></div><div className="field"><label htmlFor="letter-status">Status</label><select id="letter-status" value={statusFilter} onChange={event=>setStatusFilter(event.target.value)}><option value="all">Semua status</option><option value="approved">Selesai</option><option value="pending">Proses lama</option><option value="rejected">Ditolak</option></select></div><div className="field"><label htmlFor="letter-type-filter">Jenis surat</label><select id="letter-type-filter" value={typeFilter} onChange={event=>setTypeFilter(event.target.value)}><option value="all">Semua jenis</option>{letterTypeOptions.map(([value,text])=><option key={value} value={value}>{text}</option>)}</select></div></div>
      <div className="letter-list">{filtered.length?filtered.map(item=><article className="letter-card" key={item.id}><div className="letter-card-main"><div className="letter-card-tags"><span className={`status-pill ${item.status}`}>{statusLabels[item.status]}</span><span className="request-code">#{item.id.slice(0,8).toUpperCase()}</span></div><h3>{letterLabels[item.letter_type as LetterType]??item.letter_type}</h3><p><strong>{item.member_name}</strong>{item.member_code?` · ${item.member_code}`:""}{item.rt?` · RT ${item.rt}/RW ${item.rw}`:""}</p><p>{item.purpose}</p>{item.letter_type==="business"&&<p className="letter-extra">Usaha: {item.extra_data?.businessName||"—"} · {item.extra_data?.businessAddress||"—"}</p>}{item.letter_type==="crowd_permit"&&<p className="letter-extra">Kegiatan: {item.extra_data?.eventName||"—"} · {item.extra_data?.eventDate||"—"}</p>}{item.letter_type==="loss"&&<p className="letter-extra">Kehilangan: {item.extra_data?.lostItem||"—"}</p>}<small>Dibuat {formatDate(item.created_at)}</small>{item.letter_number&&<p className="letter-number">Nomor: {item.letter_number}</p>}{item.notes&&<p className="note">Catatan: {item.notes}</p>}{item.reviewed_by&&<small>Dicatat oleh {roleLabels[item.reviewed_by]??item.reviewed_by}</small>}</div><div className="row-actions">{item.status==="pending"&&canManage&&<><button className="button small dark" onClick={()=>setReviewState({item,action:"approve"})}>Selesaikan</button><button className="button small danger" onClick={()=>setReviewState({item,action:"reject"})}>Tolak</button></>}{item.status==="approved"&&<a className="button small dark" href={`/api/letters/${item.id}/docx`}>Unduh Word</a>}</div></article>):<div className="empty-state">Belum ada surat yang sesuai dengan pencarian atau filter.</div>}</div>
    </section>
  </div>;
}
