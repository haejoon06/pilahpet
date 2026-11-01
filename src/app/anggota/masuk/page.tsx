import type { Metadata } from "next";
import Link from "next/link";
import MemberLoginForm from "@/components/member-login-form";

export const metadata: Metadata = { title: "Masuk Anggota" };

export default function MemberLoginPage() {
  return <main className="auth-page"><section className="login-card"><Link className="brand" href="/">Pilah<span>PET</span></Link><p className="eyebrow green auth-eyebrow">PORTAL ANGGOTA</p><h1>Lihat setoran dan saldo</h1><p>Masukkan kode anggota dan PIN yang diberikan operator setelah pendaftaran disetujui.</p><MemberLoginForm /><div className="auth-links"><Link href="/daftar">Belum terdaftar? Daftar sekarang</Link><Link className="subtle" href="/">← Kembali ke halaman publik</Link></div></section></main>;
}
