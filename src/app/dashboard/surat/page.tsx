import { requirePageSession } from "@/lib/auth";
import LetterAdminPanel from "@/components/letter-admin-panel";
export const instant=false;
export default async function LettersPage(){const session=await requirePageSession();if(!["chairperson","secretary","admin"].includes(session.role))return <div className="admin-page"><div className="empty-state">Anda tidak memiliki akses ke surat menyurat.</div></div>;return <div className="admin-page"><div className="admin-page-head"><div><p className="eyebrow green">PELAYANAN ADMINISTRASI</p><h1>Administrasi Surat-Menyurat</h1><p>Pengurus mencatat permohonan warga, membuat nomor surat, dan mencetak dokumen Word.</p></div></div><LetterAdminPanel role={session.role}/></div>;}
