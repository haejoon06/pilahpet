import Link from "next/link";

const accepted = ["Botol air mineral PET", "Botol teh atau minuman ringan PET", "Ukuran 330 ml–2 liter", "Kosong, bersih, dan kering"];
const rejected = ["Kaca dan kaleng", "Plastik non-PET", "Botol masih berisi cairan", "Kemasan oli, pestisida, obat, atau bahan kimia"];

export default function Home() {
  return (
    <main>
      <section className="hero">
        <nav className="nav shell">
          <Link className="brand" href="/">SiPilah <span>PET</span></Link>
          <div className="nav-links"><a href="#alur">Alur</a><a href="#ketentuan">Ketentuan</a><Link className="button small" href="/login">Masuk Pengelola</Link></div>
        </nav>
        <div className="shell hero-grid">
          <div>
            <p className="eyebrow">PKM-ABDimas • SATU TITIK PERCONTOHAN</p>
            <h1>Botol PET terpilah, tercatat, dan bernilai.</h1>
            <p className="lead">Sistem pengelolaan botol minuman PET berbasis alat press manual dan pencatatan digital untuk warga, operator, serta pengurus mitra.</p>
            <div className="actions"><a className="button" href="#ketentuan">Lihat ketentuan setoran</a><Link className="button ghost" href="/login">Buka aplikasi</Link></div>
            <p className="pilot-note">Lokasi pilot akan ditetapkan setelah asesmen mitra. Sensor dan IoT belum diaktifkan pada tahap pertama.</p>
          </div>
          <div className="hero-card" aria-label="Ringkasan material">
            <div className="bottle" aria-hidden="true"><span>1</span><small>PET</small></div>
            <h2>Fokus tahap pertama</h2>
            <p>Hanya botol minuman berkode resin 1. Tutup dilepas sebelum pengepresan dan berat dicatat operator.</p>
            <div className="stat-row"><div><strong>Manual</strong><span>alat press</span></div><div><strong>Digital</strong><span>pencatatan</span></div><div><strong>Terukur</strong><span>stok & kas</span></div></div>
          </div>
        </div>
      </section>

      <section id="ketentuan" className="section shell">
        <p className="eyebrow green">SEBELUM MENYETOR</p><h2 className="section-title">Pastikan material tepat</h2>
        <div className="two-cols">
          <article className="info-card accept"><h3>✓ Diterima</h3><ul>{accepted.map((item) => <li key={item}>{item}</li>)}</ul></article>
          <article className="info-card reject"><h3>× Ditolak</h3><ul>{rejected.map((item) => <li key={item}>{item}</li>)}</ul></article>
        </div>
      </section>

      <section id="alur" className="section muted">
        <div className="shell"><p className="eyebrow green">ALUR LAYANAN</p><h2 className="section-title">Enam langkah yang mudah diaudit</h2>
          <div className="steps">{[
            ["01", "Daftar", "Warga memperoleh kode anggota."], ["02", "Periksa", "Operator memeriksa jenis dan kebersihan."],
            ["03", "Timbang", "Berat bersih ditimbang manual."], ["04", "Catat", "Harga aktif disimpan sebagai snapshot."],
            ["05", "Press", "Botol dipres dan masuk stok."], ["06", "Jual", "Stok, kas, dan manfaat direkonsiliasi."],
          ].map(([no, title, copy]) => <article className="step" key={no}><span>{no}</span><h3>{title}</h3><p>{copy}</p></article>)}</div>
        </div>
      </section>

      <footer><div className="shell footer"><div><strong>SiPilah PET</strong><p>Rancangan PKM-Abdimas untuk pengelolaan botol PET berbasis masyarakat.</p></div><p>Next.js • Vercel • Neon PostgreSQL</p></div></footer>
    </main>
  );
}
