import type { Metadata } from "next";
import Link from "next/link";
import MemberLoginForm from "@/components/member-login-form";

export const metadata: Metadata = { title: "Masuk Warga" };
export const instant = false;

export default async function MemberLoginPage({searchParams}:{searchParams:Promise<{next?:string}>}) {
  const {next}=await searchParams;
  return <main className="auth-page smart-auth"><section className="login-card"><Link className="brand smart-brand" href="/">RT<span>SMART</span></Link><p className="eyebrow green auth-eyebrow">PORTAL WARGA</p><h1>Masuk ke layanan RT</h1><p>Gunakan kode warga dan PIN yang dibuat oleh pengurus RT.</p><MemberLoginForm next={next}/><div className="auth-links"><span className="subtle">Belum punya akun? Hubungi pengurus RT.</span><Link className="subtle" href="/">← Kembali ke portal RT</Link></div></section></main>;
}
