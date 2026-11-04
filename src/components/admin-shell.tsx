"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/lib/auth";

const roleLabel:Record<Role,string>={admin:"Administrator RT",operator:"Petugas RT",treasurer:"Bendahara Pilah Botol",supervisor:"Pengawas"};
const items:Array<{href:string;label:string;icon:string;roles:Role[]}>= [
  {href:"/dashboard",label:"Ringkasan",icon:"⌂",roles:["admin","operator","treasurer","supervisor"]},
  {href:"/dashboard/kependudukan",label:"Data Kependudukan",icon:"◉",roles:["admin","operator","supervisor"]},
  {href:"/dashboard/kas",label:"Keuangan Kas RT",icon:"Rp",roles:["admin","supervisor"]},
  {href:"/dashboard/pilah-botol",label:"Pilah Botol & QR",icon:"♻",roles:["admin","operator","treasurer","supervisor"]},
  {href:"/dashboard/surat",label:"Surat Menyurat",icon:"✉",roles:["admin","operator","supervisor"]},
  {href:"/dashboard/pengaturan",label:"Pengaturan RT",icon:"⚙",roles:["admin"]},
];

export default function AdminShell({role,children}:{role:Role;children:React.ReactNode}){
  const pathname=usePathname();
  return <main className="admin-app"><aside className="admin-sidebar"><Link className="brand smart-brand" href="/">RT<span>SMART</span></Link><div className="admin-role"><span>Panel pengurus</span><strong>{roleLabel[role]}</strong></div><nav>{items.filter((item)=>item.roles.includes(role)).map((item)=><Link key={item.href} href={item.href} className={pathname===item.href?"active":""}><span>{item.icon}</span>{item.label}</Link>)}</nav><div className="sidebar-foot"><Link href="/">Lihat portal publik</Link><form action="/api/auth/logout" method="post"><button type="submit">Keluar akun</button></form></div></aside><section className="admin-workspace"><header className="admin-mobile-head"><Link className="brand smart-brand" href="/">RT<span>SMART</span></Link><span>{roleLabel[role]}</span></header>{children}</section></main>;
}
