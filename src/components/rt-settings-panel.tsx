"use client";

import { FormEvent,useCallback,useEffect,useState } from "react";

type Settings={
  name:string;address?:string|null;rt_number?:string|null;rw_number?:string|null;village?:string|null;
  subdistrict?:string|null;regency?:string|null;postal_code?:string|null;chairperson_name?:string|null;
};
type Position="chairperson"|"secretary"|"treasurer"|"admin"|"waste_manager";
type Official={id:string;position:Position;full_name:string;start_date:string;end_date?:string|null;phone?:string|null;notes?:string|null;current:boolean};

const positionLabels:Record<Position,string>={
  chairperson:"Ketua RT",secretary:"Sekretaris",treasurer:"Bendahara",admin:"Admin",waste_manager:"Pengelola Sampah Botol",
};
const positionOptions=Object.entries(positionLabels) as Array<[Position,string]>;
const dateValue=(value?:string|null)=>value?String(value).slice(0,10):"";
const dateLabel=(value?:string|null)=>value?new Intl.DateTimeFormat("id-ID",{dateStyle:"long",timeZone:"Asia/Jakarta"}).format(new Date(`${dateValue(value)}T00:00:00+07:00`)):"Sekarang";

export default function RtSettingsPanel(){
  const [data,setData]=useState<Settings|null>(null);
  const [officials,setOfficials]=useState<Official[]>([]);
  const [editing,setEditing]=useState<Official|null>(null);
  const [message,setMessage]=useState("");
  const [error,setError]=useState(false);
  const [busy,setBusy]=useState(false);

  const load=useCallback(async()=>{
    const [locationResponse,officialResponse]=await Promise.all([fetch("/api/settings/location"),fetch("/api/settings/officials")]);
    if(locationResponse.ok)setData(await locationResponse.json());
    if(officialResponse.ok)setOfficials(await officialResponse.json());
  },[]);
  useEffect(()=>{
    let active=true;
    Promise.all([fetch("/api/settings/location"),fetch("/api/settings/officials")]).then(async([locationResponse,officialResponse])=>{
      const [locationBody,officialBody]=await Promise.all([locationResponse.json().catch(()=>null),officialResponse.json().catch(()=>[])]);
      if(!active)return;
      if(locationResponse.ok)setData(locationBody);
      if(officialResponse.ok)setOfficials(officialBody);
    });
    return()=>{active=false;};
  },[]);

  async function syncLocation(){
    setBusy(true);setMessage("");setError(false);
    const response=await fetch("/api/settings/location/sync",{method:"POST"});
    const body=await response.json().catch(()=>({}));setBusy(false);
    if(!response.ok){setError(true);setMessage(body.error??"Identitas wilayah belum dapat disinkronkan.");return;}
    setData(body);setMessage("Identitas wilayah berhasil disinkronkan dari Data Kependudukan.");
  }

  async function saveOfficial(event:FormEvent<HTMLFormElement>){
    event.preventDefault();const form=event.currentTarget;setBusy(true);setMessage("");setError(false);
    const response=await fetch(editing?`/api/settings/officials/${editing.id}`:"/api/settings/officials",{
      method:editing?"PATCH":"POST",headers:{"content-type":"application/json"},body:JSON.stringify(Object.fromEntries(new FormData(form))),
    });
    const body=await response.json().catch(()=>({}));setBusy(false);
    if(!response.ok){setError(true);setMessage(body.error??"Data pengurus belum dapat disimpan.");return;}
    form.reset();setEditing(null);setMessage(editing?"Data pengurus berhasil diperbarui.":"Data pengurus berhasil ditambahkan.");await load();
  }

  async function removeOfficial(item:Official){
    if(!window.confirm(`Hapus riwayat ${positionLabels[item.position]} atas nama ${item.full_name}?`))return;
    setBusy(true);setMessage("");setError(false);
    const response=await fetch(`/api/settings/officials/${item.id}`,{method:"DELETE"});
    const body=await response.json().catch(()=>({}));setBusy(false);
    if(!response.ok){setError(true);setMessage(body.error??"Data pengurus belum dapat dihapus.");return;}
    if(editing?.id===item.id)setEditing(null);setMessage("Riwayat pengurus berhasil dihapus.");await load();
  }

  if(!data)return <div className="empty-state">Memuat pengaturan RT…</div>;
  const identityReady=Boolean(data.rt_number&&data.rw_number&&data.village&&data.subdistrict&&data.regency);
  return <div className="module-stack">
    {message&&<p className={`message ${error?"error":"success"}`} role="status">{message}</p>}
    <section className="panel settings-panel">
      <div className="panel-head"><div><h2>Identitas wilayah sistem</h2><p className="subtle">RT/RW tidak diketik saat membuat surat. Sistem mengambilnya dari Data Kependudukan agar konsisten.</p></div><span className={`status-pill ${identityReady?"approved":"pending"}`}>{identityReady?"Tersinkron":"Belum lengkap"}</span></div>
      <div className="profile-card">
        <div><span>RT/RW</span><strong>{data.rt_number&&data.rw_number?`RT ${data.rt_number}/RW ${data.rw_number}`:"—"}</strong></div>
        <div><span>Desa/Kelurahan</span><strong>{data.village||"—"}</strong></div>
        <div><span>Kecamatan</span><strong>{data.subdistrict||"—"}</strong></div>
        <div><span>Kabupaten/Kota</span><strong>{data.regency||"—"}</strong></div>
        <div><span>Kode pos</span><strong>{data.postal_code||"—"}</strong></div>
        <div><span>Ketua RT aktif</span><strong>{data.chairperson_name||"Belum ditetapkan"}</strong></div>
        <div className="wide"><span>Alamat pada kop surat</span><strong>{data.address||"—"}</strong></div>
      </div>
      <div className="row-actions"><button className="button secondary" type="button" onClick={syncLocation} disabled={busy}>{busy?"Menyinkronkan…":"Sinkronkan dari Data Kependudukan"}</button></div>
    </section>

    <section className="panel settings-panel">
      <div className="panel-head"><div><h2>Periode kepengurusan RT</h2><p className="subtle">Simpan Ketua RT dan pengurus berdasarkan masa jabatan. Surat otomatis memakai Ketua RT yang aktif.</p></div><span className="result-count">{officials.length} riwayat</span></div>
      <form className="form" onSubmit={saveOfficial} key={editing?.id??"new"}>
        <div className="field"><label htmlFor="official-position">Jabatan</label><select id="official-position" name="position" defaultValue={editing?.position??"chairperson"}>{positionOptions.map(([value,label])=><option value={value} key={value}>{label}</option>)}</select></div>
        <div className="field"><label htmlFor="official-name">Nama lengkap</label><input id="official-name" name="fullName" defaultValue={editing?.full_name??""} required/></div>
        <div className="field"><label htmlFor="official-start">Mulai menjabat</label><input id="official-start" name="startDate" type="date" defaultValue={dateValue(editing?.start_date)} required/></div>
        <div className="field"><label htmlFor="official-end">Selesai menjabat <span className="optional">(kosong jika masih aktif)</span></label><input id="official-end" name="endDate" type="date" defaultValue={dateValue(editing?.end_date)}/></div>
        <div className="field"><label htmlFor="official-phone">Nomor kontak <span className="optional">(opsional)</span></label><input id="official-phone" name="phone" defaultValue={editing?.phone??""}/></div>
        <div className="field"><label htmlFor="official-notes">Catatan <span className="optional">(opsional)</span></label><input id="official-notes" name="notes" defaultValue={editing?.notes??""}/></div>
        <div className="row-actions wide"><button className="button dark" disabled={busy}>{busy?"Menyimpan…":editing?"Simpan perubahan":"Tambah pengurus"}</button>{editing&&<button className="button secondary" type="button" onClick={()=>setEditing(null)} disabled={busy}>Batal</button>}</div>
      </form>
      <div className="table-wrap"><table className="data-table"><thead><tr><th>Jabatan</th><th>Nama</th><th>Periode</th><th>Status</th><th>Aksi</th></tr></thead><tbody>{officials.length?officials.map(item=><tr key={item.id}><td>{positionLabels[item.position]}</td><td><strong>{item.full_name}</strong>{item.phone&&<><br/><small>{item.phone}</small></>}</td><td>{dateLabel(item.start_date)} – {dateLabel(item.end_date)}</td><td><span className={`status-pill ${item.current?"approved":"rejected"}`}>{item.current?"Aktif":"Riwayat"}</span></td><td><div className="row-actions"><button className="button small secondary" type="button" onClick={()=>setEditing(item)}>Ubah</button><button className="button small danger" type="button" onClick={()=>removeOfficial(item)}>Hapus</button></div></td></tr>):<tr><td colSpan={5}>Belum ada riwayat pengurus. Tambahkan Ketua RT aktif terlebih dahulu.</td></tr>}</tbody></table></div>
    </section>
  </div>;
}
