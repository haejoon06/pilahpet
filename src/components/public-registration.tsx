"use client";

import { FormEvent, useState } from "react";

type ApplicationResult = { application_code: string; name: string; status: string };
type CheckResult = { application_code: string; name: string; group_name?: string | null; participant_category: string; rt?: string | null; rw?: string | null; village?: string | null; status: string; notes?: string | null; created_at: string; reviewed_at?: string | null };

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
  const categoryLabel = (category: string) => ({ elementary: "SD", junior_high: "SMP", senior_high: "SMA/SMK", adult: "Dewasa" }[category] ?? category);

  return <div className="registration-grid">
    <section className="panel public-panel"><h2>Formulir pendaftaran</h2><p className="subtle">Data akan diperiksa operator sebelum akun anggota diterbitkan.</p>
      <form className="form" onSubmit={register}>
        <div className="field"><label htmlFor="name">Nama lengkap</label><input id="name" name="name" autoComplete="name" required minLength={2} /></div>
        <div className="inline"><div className="field"><label htmlFor="groupName">Nama kelompok atau instansi <span className="optional">(opsional)</span></label><input id="groupName" name="groupName" placeholder="Contoh: SDN Karawang 1, Karang Taruna" /></div><div className="field"><label htmlFor="participantCategory">Kategori peserta</label><select id="participantCategory" name="participantCategory" required><option value="elementary">Anak SD</option><option value="junior_high">Anak SMP</option><option value="senior_high">SMA/SMK</option><option value="adult">Dewasa</option></select></div></div>
        <div className="address-grid"><div className="field"><label htmlFor="rt">RT</label><input id="rt" name="rt" inputMode="numeric" pattern="[0-9]{1,3}" placeholder="001" required /></div><div className="field"><label htmlFor="rw">RW</label><input id="rw" name="rw" inputMode="numeric" pattern="[0-9]{1,3}" placeholder="002" required /></div><div className="field"><label htmlFor="village">Desa/Kelurahan</label><input id="village" name="village" autoComplete="address-level3" required minLength={2} /></div></div>
        <div className="field"><label htmlFor="phone">Nomor WhatsApp</label><input id="phone" name="phone" inputMode="tel" autoComplete="tel" required minLength={8} /><small className="field-hint">Untuk peserta anak, gunakan nomor WhatsApp orang tua atau wali.</small></div>
        <div className="inline"><div className="field"><label htmlFor="accountType">Jenis pendaftar</label><select id="accountType" name="accountType"><option value="individual">Individu</option><option value="group">Kelompok</option></select></div><div className="field"><label htmlFor="benefitMode">Model manfaat</label><select id="benefitMode" name="benefitMode"><option value="individual_balance">Saldo individu</option><option value="group_cash">Kas kelompok</option></select></div></div>
        <button className="button dark" disabled={busy}>{busy ? "Menyimpan…" : "Kirim pendaftaran"}</button>
      </form>
      {result && <div className="success-card" role="status"><strong>Pendaftaran berhasil.</strong><p>Simpan kode berikut untuk memeriksa status:</p><code>{result.application_code}</code></div>}
    </section>
    <aside className="panel public-panel"><h2>Cek status</h2><p className="subtle">Masukkan kode REG yang diterima setelah mendaftar.</p>
      <form className="form compact-form" onSubmit={checkStatus}><div className="field"><label htmlFor="code">Kode pendaftaran</label><input id="code" name="code" placeholder="REG-..." required /></div><button className="button dark">Periksa status</button></form>
      {check && <div className="status-card" role="status"><span className={`status-pill ${check.status}`}>{statusLabel(check.status)}</span><h3>{check.name}</h3>{check.group_name && <p>Kelompok: <strong>{check.group_name}</strong></p>}<p>{categoryLabel(check.participant_category)} • RT {check.rt ?? "-"}/RW {check.rw ?? "-"} • {check.village ?? "-"}</p><p>Kode: <strong>{check.application_code}</strong></p>{check.notes && <p>Catatan operator: {check.notes}</p>}</div>}
      {message && <p className="message error" role="alert">{message}</p>}
      <div className="help-card"><h3>Setelah disetujui</h3><p>Operator memberikan kode anggota dan PIN 6 digit. Keduanya dipakai untuk membuka portal anggota dan melihat riwayat setoran.</p></div>
    </aside>
  </div>;
}
