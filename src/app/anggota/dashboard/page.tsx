import Link from "next/link";
import { requireMemberPageSession } from "@/lib/auth";
import { getMemberPortalData } from "@/lib/db";

export const instant = false;

const rupiah = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);

export default async function MemberDashboardPage() {
  const session = await requireMemberPageSession(); const data = await getMemberPortalData(session.memberId);
  const member = data.member as { member_code:string; name:string; area:string; benefit_mode:string; balance:number };
  const deposits = data.deposits as { id:string; net_weight_kg:number; price_snapshot:number; total_value:number; status:string; confirmed_at:string; rejection_reason?:string|null }[];
  const totalKg = deposits.filter((item) => item.status === "confirmed").reduce((sum, item) => sum + Number(item.net_weight_kg), 0);
  return <main className="dashboard member-dashboard"><header className="dash-nav"><div className="shell"><Link className="brand" href="/">Pilah<span>PET</span></Link><form action="/api/auth/member-logout" method="post"><button className="button small ghost">Keluar</button></form></div></header><div className="shell dash-main"><div className="dash-head"><div><span className="role-pill">ANGGOTA</span><h1>Halo, {member.name}</h1><p className="subtle">{member.member_code} • {member.area}</p></div></div><section className="metrics member-metrics"><div className="metric"><span>TOTAL PET DISETOR</span><strong>{totalKg.toFixed(2)} kg</strong></div><div className="metric"><span>SALDO MANFAAT</span><strong>{member.benefit_mode === "individual_balance" ? rupiah(Number(member.balance)) : "Kas kelompok"}</strong></div><div className="metric"><span>SETORAN TERCATAT</span><strong>{deposits.filter((item) => item.status === "confirmed").length}</strong></div></section><section className="panel"><h2>Riwayat setoran</h2><div className="table-wrap"><table className="data-table"><thead><tr><th>Waktu</th><th>Berat</th><th>Harga/kg</th><th>Nilai</th><th>Status</th></tr></thead><tbody>{deposits.length ? deposits.map((item) => <tr key={item.id}><td>{new Date(item.confirmed_at).toLocaleString("id-ID")}</td><td>{Number(item.net_weight_kg).toFixed(3)} kg</td><td>{rupiah(Number(item.price_snapshot))}</td><td>{rupiah(Number(item.total_value))}</td><td><span className={`status-pill ${item.status}`}>{item.status === "confirmed" ? "Terkonfirmasi" : "Dibatalkan"}</span></td></tr>) : <tr><td colSpan={5}>Belum ada setoran.</td></tr>}</tbody></table></div></section></div></main>;
}
