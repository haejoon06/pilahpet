"use client";

import { FormEvent, useState } from "react";

type ApplicationResult = { application_code: string; name: string; status: string };
type CheckResult = { application_code: string; name: string; status: string; notes?: string | null; created_at: string; reviewed_at?: string | null };

export default function PublicRegistration() {
  const [result, setResult] = useState<ApplicationResult | null>(null);
  const [check, setCheck] = useState<CheckResult | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage(""); setResult(null);
    const form = event.currentTarget; const data = Object.fromEntries(new FormData(form));
    const response = await fetch("/api/applications", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
    const body = await response.json(); setBusy(false);
    if (!response.ok) return setMessage(body.error ?? "Pendaftaran belum dapat disimpan.");
    setResult(body); form.reset();
  }

  async function checkStatus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(""); setCheck(null);
    const code = String(new FormData(event.currentTarget).get("code") ?? "");
    const response = await fetch(`/api/applications?code=${encodeURIComponent(code)}`); const body = await response.json();
    if (!response.ok) return setMessage(body.error ?? "Status tidak ditemukan.");
    setCheck(body);
  }

  const statusLabel = (status: string) => status === "approved" ? "Disetujui" : status === "rejected" ? "Ditolak" : "Menunggu peninjauan";

  return <div className="registration-grid">
    <section className="panel public-panel"><h2>Formulir pendaftaran</h2><p className="subtle">Data akan diperiksa operator sebelum akun anggota diterbitkan.</p>
      <form className="form" onSubmit={register}>
        <div className="field"><label htmlFor="name">Nama lengkap atau kelompok</label><input id="name" name="name" required minLength={2} /></div>
        <div className="inline"><div className="field"><label htmlFor="area">RT/RW atau wilayah</label><input id="area" name="area" required /></div><div className="field"><label htmlFor="phone">Nomor WhatsApp</label><input id="phone" name="phone" inputMode="tel" required minLength={8} /></div></div>
        <div className="inline"><div className="field"><label htmlFor="accountType">Jenis pendaftar</label><select id="accountType" name="accountType"><option value="individual">Individu</option><option value="group">Kelompok</option></select></div><div className="field"><label htmlFor="benefitMode">Model manfaat</label><select id="benefitMode" name="benefitMode"><option value="individual_balance">Saldo individu</option><option value="group_cash">Kas kelompok</option></select></div></div>
        <button className="button dark" disabled={busy}>{busy ? "Menyimpan…" : "Kirim pendaftaran"}</button>
      </form>
      {result && <div className="success-card" role="status"><strong>Pendaftaran berhasil.</strong><p>Simpan kode berikut untuk memeriksa status:</p><code>{result.application_code}</code></div>}
    </section>
    <aside className="panel public-panel"><h2>Cek status</h2><p className="subtle">Masukkan kode REG yang diterima setelah mendaftar.</p>
      <form className="form compact-form" onSubmit={checkStatus}><div className="field"><label htmlFor="code">Kode pendaftaran</label><input id="code" name="code" placeholder="REG-..." required /></div><button className="button dark">Periksa status</button></form>
      {check && <div className="status-card" role="status"><span className={`status-pill ${check.status}`}>{statusLabel(check.status)}</span><h3>{check.name}</h3><p>Kode: <strong>{check.application_code}</strong></p>{check.notes && <p>Catatan operator: {check.notes}</p>}</div>}
      {message && <p className="message error" role="alert">{message}</p>}
      <div className="help-card"><h3>Setelah disetujui</h3><p>Operator memberikan kode anggota dan PIN 6 digit. Keduanya dipakai untuk membuka portal anggota dan melihat riwayat setoran.</p></div>
    </aside>
  </div>;
}
