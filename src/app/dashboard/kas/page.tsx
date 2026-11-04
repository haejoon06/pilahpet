import { requirePageSession } from "@/lib/auth";
import RtCashPanel from "@/components/rt-cash-panel";
export const instant=false;
export default async function CashPage(){const session=await requirePageSession();if(!["admin","supervisor"].includes(session.role))return <div className="admin-page"><div className="empty-state">Keuangan kas RT hanya tersedia untuk Administrator RT dan Pengawas.</div></div>;return <div className="admin-page"><div className="admin-page-head"><div><p className="eyebrow green">TRANSPARANSI RT</p><h1>Keuangan Kas RT</h1><p>Catat pemasukan dan pengeluaran kas secara terpisah dari transaksi pilah botol.</p></div></div><RtCashPanel role={session.role}/></div>;}
