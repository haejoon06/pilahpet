import { requirePageSession } from "@/lib/auth";
import RtSettingsPanel from "@/components/rt-settings-panel";
export const instant=false;
export default async function SettingsPage(){const session=await requirePageSession();if(session.role!=="admin")return <div className="admin-page"><div className="empty-state">Pengaturan hanya tersedia untuk Admin.</div></div>;return <div className="admin-page"><div className="admin-page-head"><div><p className="eyebrow green">KONFIGURASI</p><h1>Pengaturan RT</h1><p>Lengkapi identitas wilayah sebelum mencetak surat resmi.</p></div></div><RtSettingsPanel/></div>;}
