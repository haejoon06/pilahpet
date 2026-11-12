import { requirePageSession } from "@/lib/auth";
import RtCashPanel from "@/components/rt-cash-panel";
export const instant=false;
export default async function CashPage(){const session=await requirePageSession();if(!["chairperson","treasurer","admin"].includes(session.role))return <div className="admin-page"><div className="empty-state">Dana Kematian hanya tersedia untuk Ketua RT, Bendahara, dan Admin.</div></div>;return <div className="admin-page"><div className="admin-page-head"><div><p className="eyebrow green">KEPEDULIAN WARGA</p><h1>Dana Kematian</h1><p>Catat iuran bulanan dengan nominal bebas dan penyaluran santunan kepada keluarga yang ditinggalkan.</p></div></div><RtCashPanel role={session.role}/></div>;}
