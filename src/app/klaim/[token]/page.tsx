import Link from "next/link";
import { cookies } from "next/headers";
import { MEMBER_SESSION_COOKIE,readSession } from "@/lib/auth";
import { getSql } from "@/lib/db";
import VoucherClaim from "@/components/voucher-claim";

export const instant=false;
const rupiah=(value:number)=>new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(value);

export default async function ClaimPage({params}:{params:Promise<{token:string}>}){
  const {token}=await params; const sql=getSql();
  const [event]=await sql`SELECT bottle_count,weight_kg::float8,voucher_amount::float8,status,expires_at FROM bottle_events WHERE claim_token=${token}`;
  const jar=await cookies(); const session=await readSession(jar.get(MEMBER_SESSION_COOKIE)?.value); const loggedIn=session?.kind==="member";
  const available=event&&event.status==="available"&&new Date(event.expires_at)>new Date();
  return <main className="claim-page"><section className="claim-card"><Link className="brand smart-brand" href="/">RT<span>SMART</span></Link><p className="eyebrow green">VOUCHER PILAH BOTOL</p>{event?<><h1>{available?"Setoran botol terdeteksi":"QR tidak aktif"}</h1><div className="claim-summary"><div><span>Botol</span><strong>{event.bottle_count}</strong></div><div><span>Berat</span><strong>{Number(event.weight_kg).toFixed(3)} kg</strong></div><div><span>Voucher</span><strong>{rupiah(Number(event.voucher_amount))}</strong></div></div>{available?(loggedIn?<VoucherClaim token={token}/>:<><p>Masuk ke akun warga untuk menerima voucher ini.</p><Link className="button dark" href={`/anggota/masuk?next=${encodeURIComponent(`/klaim/${token}`)}`}>Masuk sebagai warga</Link></>):<p className="message error">QR sudah digunakan atau kedaluwarsa.</p>}</>:<><h1>QR tidak ditemukan</h1><p>Periksa kembali QR yang ditampilkan alat.</p></>}<Link className="subtle back-link" href="/">← Kembali ke portal RT</Link></section></main>;
}
