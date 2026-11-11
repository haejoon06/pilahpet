import Link from "next/link";
import { requirePageSession } from "@/lib/auth";
import { getLocation,getSql } from "@/lib/db";

export const instant=false;
const rupiah=(value:number)=>new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(value);

export default async function AdminOverview(){
  const session=await requirePageSession();const location=await getLocation();const sql=getSql();
  const [stats]=await sql`SELECT
    (SELECT count(*)::int FROM households WHERE location_id=${location!.id}) AS households,
    (SELECT count(*)::int FROM residents WHERE location_id=${location!.id} AND active=true) AS residents,
    (SELECT count(*)::int FROM members WHERE location_id=${location!.id} AND active=true) AS accounts,
    (SELECT count(*)::int FROM letter_requests WHERE location_id=${location!.id} AND status='pending') AS pending_letters,
    (SELECT count(*)::int FROM bottle_events WHERE location_id=${location!.id} AND status='claimed') AS bottle_claims,
    (SELECT COALESCE(sum(CASE WHEN entry_type='income' THEN amount ELSE -amount END),0)::float8 FROM rt_cash_entries WHERE location_id=${location!.id}) AS rt_cash`;
  const quick=[
    {href:"/dashboard/kependudukan",title:"Data kependudukan",copy:"Keluarga, penduduk, wilayah otomatis, dan akun warga.",roles:["chairperson","secretary","admin"]},
    {href:"/dashboard/kas",title:"Keuangan kas RT",copy:"Buku kas masuk dan keluar khusus pengelola RT.",roles:["chairperson","treasurer","admin"]},
    {href:"/dashboard/pilah-botol",title:"Pilah botol & voucher",copy:"Pantau setoran sensor, QR, klaim, dan voucher warga.",roles:["chairperson","admin","waste_manager"]},
    {href:"/dashboard/surat",title:"Surat menyurat",copy:"Proses pengajuan dan unduh surat Word siap cetak.",roles:["chairperson","secretary","admin"]},
  ].filter((item)=>item.roles.includes(session.role));
  return <div className="admin-page"><div className="admin-page-head"><div><p className="eyebrow green">PANEL PENGURUS RT</p><h1>Selamat datang di RT SMART</h1><p>Kelola pelayanan warga dalam satu panel yang tertata dan mudah diaudit.</p></div><span className="live-badge">● Sistem aktif</span></div><section className="admin-stats"><div><span>Keluarga</span><strong>{stats.households}</strong></div><div><span>Penduduk</span><strong>{stats.residents}</strong></div><div><span>Akun warga</span><strong>{stats.accounts}</strong></div><div><span>Surat menunggu</span><strong>{stats.pending_letters}</strong></div><div><span>Klaim botol</span><strong>{stats.bottle_claims}</strong></div><div><span>Saldo kas RT</span><strong>{rupiah(Number(stats.rt_cash))}</strong></div></section><section><div className="section-mini-head"><div><h2>Menu layanan</h2><p>Pilih modul untuk mulai bekerja.</p></div></div><div className="admin-module-grid">{quick.map((item)=><Link href={item.href} key={item.href}><span>→</span><h3>{item.title}</h3><p>{item.copy}</p></Link>)}</div></section></div>;
}
