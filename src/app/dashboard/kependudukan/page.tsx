import { requirePageSession } from "@/lib/auth";
import PopulationPanel from "@/components/population-panel";
export const instant=false;

export default async function PopulationPage(){const session=await requirePageSession();if(!["chairperson","secretary","admin"].includes(session.role))return <div className="admin-page"><div className="empty-state">Anda tidak memiliki akses ke data kependudukan.</div></div>;return <div className="admin-page"><div className="admin-page-head"><div><p className="eyebrow green">SMART COMMUNITY</p><h1>Data Kependudukan</h1><p>Kelola keluarga, penduduk, akun warga, dan pencarian RT/RW.</p></div></div><PopulationPanel role={session.role}/></div>;}
