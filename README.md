# PilahPET

Aplikasi PKM-Abdimas untuk pendaftaran warga, portal anggota, setoran botol minuman PET, harga, stok, manfaat, penjualan, kas, pemeliharaan alat, laporan, dan audit pada satu titik pilot.

## Fitur siap pakai

- Pendaftaran warga dengan status menunggu, disetujui, atau ditolak.
- Penerbitan kode anggota dan PIN 6 digit oleh operator.
- Portal anggota untuk melihat berat, saldo, dan riwayat setoran.
- Dashboard berbasis peran untuk operator, bendahara, pengawas, dan administrator.
- Setoran dengan price snapshot, stok, ledger manfaat, audit, dan pencegahan transaksi ganda.
- Pembatalan setoran melalui jurnal reversal tanpa menghapus histori.
- Harga PET, penjualan ke pengepul, buku kas, serta pencairan saldo individu.
- Log inspeksi dan pemeliharaan alat press.
- Ekspor CSV anggota, setoran, penjualan, dan kas.
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
