"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect,useRef } from "react";
import { ROLE_LABELS, type Role } from "@/lib/roles";
import NavIcon,{type NavIconName} from "@/components/nav-icon";

const items:Array<{href:string;label:string;shortLabel:string;icon:NavIconName;roles:Role[]}>= [
  {href:"/dashboard",label:"Ringkasan",shortLabel:"Beranda",icon:"home",roles:["chairperson","secretary","treasurer","admin","waste_manager"]},
  {href:"/dashboard/kependudukan",label:"Data Kependudukan",shortLabel:"Warga",icon:"people",roles:["chairperson","secretary","admin"]},
  {href:"/dashboard/kas",label:"Dana Kematian",shortLabel:"Dana",icon:"wallet",roles:["chairperson","treasurer","admin"]},
  {href:"/dashboard/pilah-botol",label:"Pilah Botol & QR",shortLabel:"Botol",icon:"recycle",roles:["chairperson","admin","waste_manager"]},
  {href:"/dashboard/surat",label:"Surat Pengantar",shortLabel:"Surat",icon:"mail",roles:["chairperson","secretary","admin"]},
  {href:"/dashboard/pengaturan",label:"Pengaturan RT",shortLabel:"Atur",icon:"settings",roles:["chairperson","admin"]},
];

export default function AdminShell({role,children}:{role:Role;children:React.ReactNode}){
  const pathname=usePathname();
  const activeItem=useRef<HTMLAnchorElement>(null);
  useEffect(()=>{if(window.matchMedia("(max-width: 850px)").matches)activeItem.current?.scrollIntoView({behavior:"instant",block:"nearest",inline:"center"});},[pathname]);
  return <main className="admin-app"><aside className="admin-sidebar"><Link className="brand smart-brand" href="/">RT<span>SMART</span></Link><div className="admin-role"><span>Panel pengurus</span><strong>{ROLE_LABELS[role]}</strong></div><nav aria-label="Menu pengurus">{items.filter((item)=>item.roles.includes(role)).map((item)=>{const active=pathname===item.href;return <Link ref={active?activeItem:undefined} key={item.href} href={item.href} className={active?"active":""} aria-current={active?"page":undefined}><span className="sidebar-nav-icon"><NavIcon name={item.icon}/></span><span className="sidebar-nav-label"><span className="desktop-label">{item.label}</span><span className="mobile-label">{item.shortLabel}</span></span></Link>;})}</nav><form className="mobile-sidebar-logout" action="/api/auth/logout" method="post"><button type="submit" aria-label="Keluar akun"><span className="sidebar-nav-icon"><NavIcon name="logout"/></span><span>Keluar</span></button></form><div className="sidebar-foot"><Link href="/">Lihat portal publik</Link><form action="/api/auth/logout" method="post"><button type="submit">Keluar akun</button></form></div></aside><section className="admin-workspace">{children}</section></main>;
}
