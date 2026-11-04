"use client";

import { useEffect,useMemo,useState } from "react";

type LetterStatus="pending"|"approved"|"rejected";
type Letter={id:string;letter_type:string;purpose:string;extra_data?:{businessName?:string|null};status:LetterStatus;letter_number?:string|null;notes?:string|null;created_at:string};
const labels:Record<string,string>={introduction:"Surat Pengantar",domicile:"Keterangan Domisili",business:"Keterangan Usaha",indigent:"Keterangan Tidak Mampu"};
const statusLabels:Record<LetterStatus,string>={pending:"Sedang diproses RT",approved:"Selesai",rejected:"Tidak diterbitkan"};
const formatDate=(value:string)=>new Intl.DateTimeFormat("id-ID",{dateStyle:"long",timeStyle:"short",timeZone:"Asia/Jakarta"}).format(new Date(value));

export default function CitizenLetters(){
  const [items,setItems]=useState<Letter[]>([]);
  useEffect(()=>{let active=true;fetch("/api/letters").then(async response=>({response,body:await response.json().catch(()=>[])})).then(({response,body})=>{if(active&&response.ok)setItems(body);});return()=>{active=false;};},[]);
  const completed=useMemo(()=>items.filter(item=>item.status==="approved").length,[items]);

  return <div className="module-stack">
    <section className="citizen-letter-notice"><p className="eyebrow green">PROSEDUR PELAYANAN</p><h2>Pengajuan dilakukan langsung melalui pengurus RT</h2><p>Silakan datang ke Ketua atau Petugas RT dengan membawa informasi keperluan surat. Pengurus akan memilih data kependudukan Anda, mencatat permohonan, lalu menyiapkan surat Word untuk dicetak.</p></section>
    <section className="citizen-letter-flow" aria-label="Alur pelayanan surat"><div><span>1</span><strong>Datang ke RT</strong><small>Sampaikan jenis dan keperluan surat</small></div><i>→</i><div><span>2</span><strong>Data diperiksa</strong><small>Pengurus membuka data kependudukan</small></div><i>→</i><div><span>3</span><strong>RT membuat surat</strong><small>Nomor surat tercatat otomatis</small></div><i>→</i><div><span>4</span><strong>Surat dicetak</strong><small>Warga menerima surat dari RT</small></div></section>
    <section className="citizen-letter-stats"><div><span>Surat selesai</span><strong>{completed}</strong></div><div><span>Seluruh riwayat</span><strong>{items.length}</strong></div></section>
    <section className="panel"><div className="panel-head"><div><h2>Riwayat surat saya</h2><p className="subtle">Surat yang dicatat pengurus RT akan muncul di sini jika akun Anda terhubung dengan data kependudukan.</p></div><span className="result-count">{items.length} surat</span></div><div className="card-list">{items.length?items.map(item=><article className="letter-card citizen" key={item.id}><div className="letter-card-main"><div className="letter-card-tags"><span className={`status-pill ${item.status}`}>{statusLabels[item.status]}</span><span className="request-code">#{item.id.slice(0,8).toUpperCase()}</span></div><h3>{labels[item.letter_type]??item.letter_type}</h3><p>{item.purpose}</p>{item.letter_type==="business"&&<p className="letter-extra">Usaha: {item.extra_data?.businessName||"—"}</p>}<small>Dicatat {formatDate(item.created_at)}</small>{item.letter_number&&<p className="letter-number">Nomor: {item.letter_number}</p>}{item.notes&&<p className="note">Catatan pengurus: {item.notes}</p>}</div>{item.status==="approved"&&<a className="button small dark" href={`/api/letters/${item.id}/docx`}>Unduh Word</a>}</article>):<div className="empty-state">Belum ada surat yang dicatat pengurus RT untuk akun Anda.</div>}</div></section>
  </div>;
}
