"use client";

import { FormEvent,useEffect,useMemo,useState } from "react";
import type { Role } from "@/lib/auth";

type LetterStatus="pending"|"approved"|"rejected";
type Letter={
  id:string;letter_type:string;purpose:string;extra_data?:{businessName?:string|null;businessAddress?:string|null};
  status:LetterStatus;letter_number?:string|null;notes?:string|null;created_at:string;reviewed_at?:string|null;
  reviewed_by?:string|null;member_name:string;member_code:string;
};
type ReviewState={item:Letter;action:"approve"|"reject"}|null;

const labels:Record<string,string>={
  introduction:"Surat Pengantar",domicile:"Keterangan Domisili",business:"Keterangan Usaha",indigent:"Keterangan Tidak Mampu",
};
const statusLabels:Record<LetterStatus,string>={pending:"Menunggu",approved:"Disetujui",rejected:"Ditolak"};
const roleLabels:Record<string,string>={admin:"Administrator RT",operator:"Petugas RT",supervisor:"Pengawas"};
const formatDate=(value:string)=>new Intl.DateTimeFormat("id-ID",{dateStyle:"long",timeStyle:"short",timeZone:"Asia/Jakarta"}).format(new Date(value));

export default function LetterAdminPanel({role}:{role:Role}){
  const canManage=role==="admin"||role==="operator";
  const [items,setItems]=useState<Letter[]>([]);
  const [message,setMessage]=useState("");
  const [isError,setIsError]=useState(false);
  const [busy,setBusy]=useState(false);
  const [search,setSearch]=useState("");
  const [statusFilter,setStatusFilter]=useState("all");
  const [typeFilter,setTypeFilter]=useState("all");
  const [reviewState,setReviewState]=useState<ReviewState>(null);

  async function load(){
    const response=await fetch("/api/letters");
    const body=await response.json().catch(()=>[]);
    if(response.ok)setItems(body);
  }
  useEffect(()=>{
    let active=true;
    fetch("/api/letters").then(async response=>({response,body:await response.json().catch(()=>[])})).then(({response,body})=>{
      if(active&&response.ok)setItems(body);
    });
    return()=>{active=false;};
  },[]);

  const counts=useMemo(()=>({
    pending:items.filter(item=>item.status==="pending").length,
    approved:items.filter(item=>item.status==="approved").length,
    rejected:items.filter(item=>item.status==="rejected").length,
  }),[items]);
  const filtered=useMemo(()=>{
    const query=search.trim().toLocaleLowerCase("id-ID");
    return items.filter(item=>{
      const matchesStatus=statusFilter==="all"||item.status===statusFilter;
      const matchesType=typeFilter==="all"||item.letter_type===typeFilter;
      const haystack=`${item.member_name} ${item.member_code} ${item.purpose} ${item.letter_number??""}`.toLocaleLowerCase("id-ID");
      return matchesStatus&&matchesType&&(!query||haystack.includes(query));
    });
  },[items,search,statusFilter,typeFilter]);

  async function submitReview(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(!reviewState)return;
    setBusy(true);setMessage("");setIsError(false);
    const data=Object.fromEntries(new FormData(event.currentTarget));
    const response=await fetch(`/api/letters/${reviewState.item.id}`,{
      method:"PATCH",headers:{"content-type":"application/json"},
      body:JSON.stringify({action:reviewState.action,letterNumber:data.letterNumber??"",notes:data.notes??""}),
    });
    const body=await response.json().catch(()=>({}));setBusy(false);
    if(!response.ok){setIsError(true);setMessage(body.error??"Surat belum dapat diproses.");return;}
    setMessage(reviewState.action==="approve"?`Surat disetujui dengan nomor ${body.letter_number}. Dokumen Word siap diunduh.`:"Pengajuan surat ditolak.");
    setReviewState(null);await load();
  }

  return <div className="module-stack">
    <section className="letter-admin-stats" aria-label="Ringkasan surat">
      <div><span>Menunggu</span><strong>{counts.pending}</strong></div>
      <div><span>Disetujui</span><strong>{counts.approved}</strong></div>
      <div><span>Ditolak</span><strong>{counts.rejected}</strong></div>
      <div><span>Jumlah pengajuan</span><strong>{items.length}</strong></div>
    </section>

    {message&&<p className={`message ${isError?"error":"success"}`} role="status">{message}</p>}

    {reviewState&&<section className="panel letter-review-panel">
      <div className="panel-head"><div><p className="eyebrow green">VERIFIKASI PENGAJUAN</p><h2>{reviewState.action==="approve"?"Setujui surat":"Tolak pengajuan"}</h2><p className="subtle">{labels[reviewState.item.letter_type]} untuk {reviewState.item.member_name}</p></div><button className="text-button" type="button" onClick={()=>setReviewState(null)}>Tutup</button></div>
      <dl className="letter-review-summary"><div><dt>Kode warga</dt><dd>{reviewState.item.member_code}</dd></div><div><dt>Keperluan</dt><dd>{reviewState.item.purpose}</dd></div>{reviewState.item.letter_type==="business"&&<><div><dt>Nama usaha</dt><dd>{reviewState.item.extra_data?.businessName||"—"}</dd></div><div><dt>Alamat usaha</dt><dd>{reviewState.item.extra_data?.businessAddress||"—"}</dd></div></>}</dl>
      <form className="form" onSubmit={submitReview}>
        {reviewState.action==="approve"&&<div className="field"><label htmlFor="letter-number">Nomor surat <span className="optional">(opsional)</span></label><input id="letter-number" name="letterNumber" placeholder="Kosongkan untuk nomor berurutan otomatis"/><small className="field-hint">Format otomatis menyesuaikan jenis surat, RT/RW, bulan, dan tahun.</small></div>}
        <div className="field"><label htmlFor="review-notes">{reviewState.action==="approve"?"Catatan pengurus (opsional)":"Alasan penolakan"}</label><textarea id="review-notes" name="notes" rows={3} required={reviewState.action==="reject"}/></div>
        <div className="row-actions"><button className={`button dark ${reviewState.action==="reject"?"danger":""}`} disabled={busy}>{busy?"Memproses…":reviewState.action==="approve"?"Setujui dan buat nomor":"Tolak pengajuan"}</button><button className="button secondary" type="button" onClick={()=>setReviewState(null)} disabled={busy}>Batal</button></div>
      </form>
    </section>}

    <section className="panel">
      <div className="panel-head"><div><h2>Administrasi pengajuan surat</h2><p className="subtle">Periksa data, beri nomor, lalu unduh dokumen Word yang siap dicetak.</p></div><span className="result-count">{filtered.length} surat</span></div>
      <div className="letter-filter-bar">
        <div className="field"><label htmlFor="letter-search">Cari warga atau nomor surat</label><input id="letter-search" value={search} onChange={event=>setSearch(event.target.value)} placeholder="Nama, kode warga, atau nomor"/></div>
        <div className="field"><label htmlFor="letter-status">Status</label><select id="letter-status" value={statusFilter} onChange={event=>setStatusFilter(event.target.value)}><option value="all">Semua status</option><option value="pending">Menunggu</option><option value="approved">Disetujui</option><option value="rejected">Ditolak</option></select></div>
        <div className="field"><label htmlFor="letter-type-filter">Jenis surat</label><select id="letter-type-filter" value={typeFilter} onChange={event=>setTypeFilter(event.target.value)}><option value="all">Semua jenis</option>{Object.entries(labels).map(([value,text])=><option key={value} value={value}>{text}</option>)}</select></div>
      </div>
      <div className="letter-list">{filtered.length?filtered.map(item=><article className="letter-card" key={item.id}>
        <div className="letter-card-main"><div className="letter-card-tags"><span className={`status-pill ${item.status}`}>{statusLabels[item.status]}</span><span className="request-code">#{item.id.slice(0,8).toUpperCase()}</span></div><h3>{labels[item.letter_type]??item.letter_type}</h3><p><strong>{item.member_name}</strong> · {item.member_code}</p><p>{item.purpose}</p>{item.letter_type==="business"&&<p className="letter-extra">Usaha: {item.extra_data?.businessName||"—"} · {item.extra_data?.businessAddress||"—"}</p>}<small>Diajukan {formatDate(item.created_at)}{item.reviewed_at?` · Diproses ${formatDate(item.reviewed_at)}`:""}</small>{item.letter_number&&<p className="letter-number">Nomor: {item.letter_number}</p>}{item.notes&&<p className="note">Catatan: {item.notes}</p>}{item.reviewed_by&&<small>Diproses oleh {roleLabels[item.reviewed_by]??item.reviewed_by}</small>}</div>
        <div className="row-actions">{item.status==="pending"&&canManage&&<><button className="button small dark" onClick={()=>setReviewState({item,action:"approve"})}>Periksa & setujui</button><button className="button small danger" onClick={()=>setReviewState({item,action:"reject"})}>Tolak</button></>}{item.status==="approved"&&<a className="button small dark" href={`/api/letters/${item.id}/docx`}>Unduh Word</a>}</div>
      </article>):<div className="empty-state">Tidak ada pengajuan yang sesuai dengan pencarian atau filter.</div>}</div>
    </section>
  </div>;
}
