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

  return <main className="auth-page"><section className="login-card">
    <Link className="brand" href="/">Pilah<span>PET</span></Link>
    <h1>Masuk pengelola</h1><p>Pilih peran dan masukkan kode akses yang diberikan administrator program.</p>
    <form className="form" onSubmit={submit}>
      <div className="field"><label htmlFor="role">Peran</label><select id="role" name="role" defaultValue="operator"><option value="operator">Operator</option><option value="treasurer">Bendahara</option><option value="supervisor">Pengawas mitra</option><option value="admin">Administrator</option></select></div>
      <div className="field"><label htmlFor="code">Kode akses</label><input id="code" name="code" type="password" autoComplete="current-password" required minLength={8} /></div>
      {message && <p className="message error" role="alert">{message}</p>}
      <button className="button dark" type="submit" disabled={busy}>{busy ? "Memeriksa…" : "Masuk"}</button>
      <Link className="subtle" href="/">← Kembali ke halaman publik</Link>
    </form>
  </section></main>;
}
