import { redirect } from "next/navigation";
import Link from "next/link";
import { getDashboardData } from "@/lib/db";
import { requirePageSession } from "@/lib/auth";
import OperatorConsole from "@/components/operator-console";

export const instant = false;
const rupiah = (value:number) => new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(value);

export default async function DashboardPage() {
  const session = await requirePageSession();
  let data;
  try { data = await getDashboardData(); } catch { redirect("/?setup=database"); }
  const m = data.metrics as {members:number;deposits:number;stock_kg:number;cash_balance:number;collected_kg:number};
  return <main className="dashboard">
    <header className="dash-nav"><div className="shell"><Link className="brand" href="/">Pilah<span>PET</span></Link><form action="/api/auth/logout" method="post"><button className="button small ghost" type="submit">Keluar</button></form></div></header>
    <div className="shell dash-main">
      <div className="dash-head"><div><span className="role-pill">{session.role.toUpperCase()}</span><h1>Dashboard pengelola</h1><p className="subtle">{data.location.name} • data operasional langsung dari Neon PostgreSQL</p></div><div><strong>{data.price ? rupiah(Number(data.price.price_per_kg)) : "Belum ditetapkan"}</strong><p className="subtle">Harga PET aktif per kg</p></div></div>
      <section className="metrics">
        <div className="metric"><span>ANGGOTA AKTIF</span><strong>{m.members}</strong></div><div className="metric"><span>TRANSAKSI SETORAN</span><strong>{m.deposits}</strong></div><div className="metric"><span>PET TERKUMPUL</span><strong>{Number(m.collected_kg).toFixed(2)} kg</strong></div><div className="metric"><span>STOK SAAT INI</span><strong>{Number(m.stock_kg).toFixed(2)} kg</strong></div><div className="metric"><span>SALDO KAS</span><strong>{rupiah(Number(m.cash_balance))}</strong></div>
      </section>
      <OperatorConsole role={session.role} members={data.members as Member[]} deposits={data.deposits as Deposit[]}
        applications={data.applications as Application[]} sales={data.sales as Sale[]} prices={data.prices as Price[]}
        cashEntries={data.cashEntries as CashEntry[]} maintenance={data.maintenance as Maintenance[]} audits={data.audits as Audit[]} />
    </div>
  </main>;
}

type Member = {id:string;member_code:string;name:string;area:string;phone?:string|null;account_type:string;benefit_mode:string;balance:number};
type Deposit = {id:string;member_name:string;member_code:string;net_weight_kg:number;price_snapshot:number;total_value:number;status:string;confirmed_at:string;rejection_reason?:string|null};
type Application = {id:string;application_code:string;name:string;area:string;phone:string;account_type:string;benefit_mode:string;status:string;notes?:string|null;created_at:string};
type Sale = {id:string;buyer_name:string;weight_kg:number;price_per_kg:number;gross_value:number;transport_cost:number;net_value:number;sold_at:string};
type Price = {id:string;price_per_kg:number;effective_at:string};
type CashEntry = {id:string;entry_type:string;category:string;amount:number;notes?:string|null;created_by:string;created_at:string};
type Maintenance = {id:string;inspection_type:string;finding?:string|null;action_taken?:string|null;critical:boolean;inspected_by:string;inspected_at:string};
type Audit = {id:string;actor:string;action:string;entity_type:string;entity_id?:string|null;created_at:string};
