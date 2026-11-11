"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROLE_LABELS, type Role } from "@/lib/roles";

const items:Array<{href:string;label:string;icon:string;roles:Role[]}>= [
  {href:"/dashboard",label:"Ringkasan",icon:"⌂",roles:["chairperson","secretary","treasurer","admin","waste_manager"]},
  {href:"/dashboard/kependudukan",label:"Data Kependudukan",icon:"◉",roles:["chairperson","secretary","admin"]},
  {href:"/dashboard/kas",label:"Keuangan Kas RT",icon:"Rp",roles:["chairperson","treasurer","admin"]},
  {href:"/dashboard/pilah-botol",label:"Pilah Botol & QR",icon:"♻",roles:["chairperson","admin","waste_manager"]},
  {href:"/dashboard/surat",label:"Surat Menyurat",icon:"✉",roles:["chairperson","secretary","admin"]},
  {href:"/dashboard/pengaturan",label:"Pengaturan RT",icon:"⚙",roles:["admin"]},
];

export default function AdminShell({role,children}:{role:Role;children:React.ReactNode}){
  const pathname=usePathname();
  return <main className="admin-app"><aside className="admin-sidebar"><Link className="brand smart-brand" href="/">RT<span>SMART</span></Link><div className="admin-role"><span>Panel pengurus</span><strong>{ROLE_LABELS[role]}</strong></div><nav>{items.filter((item)=>item.roles.includes(role)).map((item)=><Link key={item.href} href={item.href} className={pathname===item.href?"active":""}><span>{item.icon}</span>{item.label}</Link>)}</nav><div className="sidebar-foot"><Link href="/">Lihat portal publik</Link><form action="/api/auth/logout" method="post"><button type="submit">Keluar akun</button></form></div></aside><section className="admin-workspace"><header className="admin-mobile-head"><Link className="brand smart-brand" href="/">RT<span>SMART</span></Link><span>{ROLE_LABELS[role]}</span></header>{children}</section></main>;
}
