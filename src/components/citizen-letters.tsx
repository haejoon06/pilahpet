"use client";

import { FormEvent,useEffect,useMemo,useState } from "react";

type LetterStatus="pending"|"approved"|"rejected";
type Letter={id:string;letter_type:string;purpose:string;extra_data?:{businessName?:string|null;businessAddress?:string|null};status:LetterStatus;letter_number?:string|null;notes?:string|null;created_at:string;reviewed_at?:string|null};
const labels:Record<string,string>={introduction:"Surat Pengantar",domicile:"Keterangan Domisili",business:"Keterangan Usaha",indigent:"Keterangan Tidak Mampu"};
const descriptions:Record<string,string>={
  introduction:"Pengantar umum untuk keperluan administrasi warga.",
  domicile:"Keterangan bahwa pemohon berdomisili di wilayah RT.",
  business:"Keterangan mengenai nama dan alamat usaha warga.",
  indigent:"Keterangan untuk keperluan pengajuan bantuan atau layanan sosial.",
};
const purposeExamples:Record<string,string>={introduction:"Contoh: pengurusan SKCK",domicile:"Contoh: persyaratan administrasi sekolah",business:"Contoh: pengajuan NIB usaha",indigent:"Contoh: persyaratan bantuan pendidikan"};
const statusLabels:Record<LetterStatus,string>={pending:"Menunggu verifikasi",approved:"Disetujui",rejected:"Ditolak"};
const formatDate=(value:string)=>new Intl.DateTimeFormat("id-ID",{dateStyle:"long",timeStyle:"short",timeZone:"Asia/Jakarta"}).format(new Date(value));

export default function CitizenLetters(){
  const [items,setItems]=useState<Letter[]>([]);
  const [type,setType]=useState("introduction");
  const [message,setMessage]=useState("");
  const [isError,setIsError]=useState(false);
  const [busy,setBusy]=useState(false);

  async function load(){const response=await fetch("/api/letters");if(response.ok)setItems(await response.json());}
  useEffect(()=>{let active=true;fetch("/api/letters").then(async response=>({response,body:await response.json().catch(()=>[])})).then(({response,body})=>{if(active&&response.ok)setItems(body);});return()=>{active=false;};},[]);
  const counts=useMemo(()=>({pending:items.filter(item=>item.status==="pending").length,approved:items.filter(item=>item.status==="approved").length}),[items]);

  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setBusy(true);setMessage("");setIsError(false);
    const form=event.currentTarget;
    const response=await fetch("/api/letters",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(Object.fromEntries(new FormData(form)))});
    const body=await response.json().catch(()=>({}));setBusy(false);
    if(!response.ok){setIsError(true);setMessage(body.error??"Pengajuan belum dapat dikirim.");return;}
    form.reset();setType("introduction");setMessage(`Pengajuan berhasil dikirim. Kode permohonan #${String(body.id).slice(0,8).toUpperCase()}.`);await load();
  }

  return <div className="module-stack">
    <section className="citizen-letter-flow" aria-label="Alur pengajuan surat"><div><span>1</span><strong>Isi formulir</strong><small>Pilih jenis dan keperluan</small></div><i>→</i><div><span>2</span><strong>Pengurus memeriksa</strong><small>Data kependudukan diverifikasi</small></div><i>→</i><div><span>3</span><strong>Surat diberi nomor</strong><small>Nomor tercatat otomatis</small></div><i>→</i><div><span>4</span><strong>Unduh Word</strong><small>Dokumen siap dicetak</small></div></section>
    <section className="citizen-letter-stats"><div><span>Menunggu</span><strong>{counts.pending}</strong></div><div><span>Siap diunduh</span><strong>{counts.approved}</strong></div><div><span>Semua pengajuan</span><strong>{items.length}</strong></div></section>
    <div className="console-grid">
      <section className="panel"><h2>Form pengajuan surat</h2><p className="subtle">Nama, NIK, tanggal lahir, pekerjaan, dan alamat diambil otomatis dari data kependudukan.</p><form className="form" onSubmit={submit}>
        <div className="field"><label htmlFor="letter-type">Jenis surat</label><select id="letter-type" name="letterType" value={type} onChange={event=>setType(event.target.value)}>{Object.entries(labels).map(([value,text])=><option value={value} key={value}>{text}</option>)}</select><small className="field-hint">{descriptions[type]}</small></div>
        {type==="business"&&<div className="business-fields"><div className="field"><label htmlFor="business-name">Nama usaha</label><input id="business-name" name="businessName" required/></div><div className="field"><label htmlFor="business-address">Alamat usaha</label><textarea id="business-address" name="businessAddress" rows={3} required/></div></div>}
        <div className="field"><label htmlFor="letter-purpose">Keperluan surat</label><textarea id="letter-purpose" name="purpose" rows={4} placeholder={purposeExamples[type]} required/><small className="field-hint">Tuliskan keperluan secara spesifik agar pengurus dapat memverifikasi pengajuan.</small></div>
        {message&&<p className={`message ${isError?"error":"success"}`} role="status">{message}</p>}
        <button className="button dark" disabled={busy}>{busy?"Mengirim…":"Kirim pengajuan surat"}</button>
      </form></section>
      <section className="panel"><div className="panel-head"><div><h2>Riwayat pengajuan</h2><p className="subtle">Pantau status dan unduh surat yang sudah disetujui.</p></div><span className="result-count">{items.length} surat</span></div><div className="card-list">{items.length?items.map(item=><article className="letter-card citizen" key={item.id}><div className="letter-card-main"><div className="letter-card-tags"><span className={`status-pill ${item.status}`}>{statusLabels[item.status]}</span><span className="request-code">#{item.id.slice(0,8).toUpperCase()}</span></div><h3>{labels[item.letter_type]??item.letter_type}</h3><p>{item.purpose}</p>{item.letter_type==="business"&&<p className="letter-extra">Usaha: {item.extra_data?.businessName||"—"}</p>}<small>Diajukan {formatDate(item.created_at)}</small>{item.letter_number&&<p className="letter-number">Nomor: {item.letter_number}</p>}{item.notes&&<p className="note">Catatan pengurus: {item.notes}</p>}</div>{item.status==="approved"&&<a className="button small dark" href={`/api/letters/${item.id}/docx`}>Unduh Word</a>}</article>):<div className="empty-state">Belum ada pengajuan surat.</div>}</div></section>
    </div>
  </div>;
}
