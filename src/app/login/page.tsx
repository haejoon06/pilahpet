"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", { method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify({ role:form.get("role"), code:form.get("code") }) });
    const data = await response.json(); setBusy(false);
    if (!response.ok) return setMessage(data.error ?? "Tidak dapat masuk.");
    router.push("/dashboard"); router.refresh();
  }

  return <main className="auth-page smart-auth"><section className="login-card">
    <Link className="brand smart-brand" href="/">RT<span>SMART</span></Link>
    <p className="eyebrow green auth-eyebrow">KHUSUS PENGURUS RT</p><h1>Masuk panel pengurus</h1><p>Pilih peran dan masukkan kode akses pengelola.</p>
    <form className="form" onSubmit={submit}>
      <div className="field"><label htmlFor="role">Peran</label><select id="role" name="role" defaultValue="chairperson"><option value="chairperson">Ketua RT</option><option value="secretary">Sekretaris</option><option value="treasurer">Bendahara</option><option value="admin">Admin</option><option value="waste_manager">Pengelola Sampah Botol</option></select></div>
      <div className="field"><label htmlFor="code">Kode akses</label><input id="code" name="code" type="password" autoComplete="current-password" required minLength={8} /></div>
      {message && <p className="message error" role="alert">{message}</p>}
      <button className="button dark" type="submit" disabled={busy}>{busy ? "Memeriksa…" : "Masuk"}</button>
      <div className="auth-links"><Link href="/anggota/masuk">Masuk sebagai warga</Link><Link className="subtle" href="/">← Kembali ke portal publik</Link></div>
    </form>
  </section></main>;
}
