# RT SMART

Portal PKM-Abdimas untuk tata kelola RT: data kependudukan, akun warga, kas RT, surat Word otomatis, serta pilah botol berbasis sensor, QR, dan voucher.

## Fitur siap pakai

- Akun warga dibuat pengurus dari data penduduk dan dilengkapi PIN 6 digit.
- Portal warga untuk profil, pengajuan surat, setoran sensor, dan voucher.
- Panel pengurus dengan halaman terpisah untuk setiap modul layanan.
- Data keluarga dan penduduk dengan pencarian RT/RW, nomor KK/NIK terenkripsi, tampilan tersamarkan, serta audit akses pencatatan.
- Buku kas RT terpisah dengan hak perubahan khusus Administrator RT.
- Form surat warga, verifikasi pengurus, penomoran berurutan, pencarian/filter, dan Word siap cetak yang terisi otomatis.
- Endpoint perangkat sensor, QR sekali pakai, klaim warga, dan ledger voucher.
- Pengaturan identitas RT untuk kop surat dan penandatangan.
- Antarmuka responsif untuk ponsel, tablet, dan komputer.

## Stack

- Next.js 16 dan TypeScript
- Vercel
- Neon PostgreSQL
- Tailwind CSS 4

## Menjalankan lokal

```bash
pnpm install
cp .env.example .env.local
node --env-file=.env.local scripts/migrate.mjs
pnpm dev
```

Isi seluruh variabel dalam `.env.local` sebelum migrasi dan login. Berkas lingkungan telah diabaikan oleh Git.

## Pemeriksaan

```bash
pnpm lint
pnpm build
```

Dokumentasi arsitektur dan deployment berada di folder [`docs`](./docs).
