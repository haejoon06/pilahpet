import { requirePageSession } from "@/lib/auth";
import BottleAdminPanel from "@/components/bottle-admin-panel";
export const instant=false;
export default async function BottlePage(){const session=await requirePageSession();return <div className="admin-page"><div className="admin-page-head"><div><p className="eyebrow green">ZERO WASTE RT</p><h1>Pilah Botol & Voucher</h1><p>Integrasi sensor, QR sekali pakai, akun warga, dan voucher digital.</p></div></div><BottleAdminPanel role={session.role}/></div>;}
