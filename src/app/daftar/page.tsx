import type { Metadata } from "next";
import Link from "next/link";
import PublicRegistration from "@/components/public-registration";

export const metadata: Metadata = { title: "Daftar Anggota" };

export default function RegistrationPage() {
  return <main className="public-form-page"><header className="simple-nav"><div className="shell"><Link className="brand" href="/">Pilah<span>PET</span></Link><div className="nav-actions"><Link href="/anggota/masuk">Masuk anggota</Link><Link className="button small dark" href="/login">Masuk pengelola</Link></div></div></header>
    <section className="shell public-form-main"><p className="eyebrow green">PENDAFTARAN WARGA</p><h1>Mulai memilah bersama PilahPET.</h1><p className="lead dark-lead">Terbuka untuk peserta tingkat SD, SMP, SMA/SMK, dan dewasa. Tidak ada NIK yang dikumpulkan, dan pendaftaran baru aktif setelah diperiksa operator.</p><PublicRegistration /></section>
  </main>;
}
