import { requirePageSession } from "@/lib/auth";
import LetterAdminPanel from "@/components/letter-admin-panel";
export const instant=false;
export default async function LettersPage(){const session=await requirePageSession();if(!["chairperson","secretary","admin"].includes(session.role))return <div className="admin-page"><div className="empty-state">Anda tidak memiliki akses ke surat menyurat.</div></div>;return <div className="admin-page"><div className="admin-page-head"><div><p className="eyebrow green">PELAYANAN ADMINISTRASI</p><h1>Surat Pengantar RT</h1><p>Pengurus membuat surat pengantar warga untuk melanjutkan administrasi di Desa Puseurjaya.</p></div></div><LetterAdminPanel role={session.role}/></div>;}
