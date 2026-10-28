# PilahPET

Aplikasi PKM-Abdimas untuk mengelola anggota, setoran botol minuman PET, harga, stok, manfaat, penjualan, kas, dan audit pada satu titik pilot.

## Stack

- Next.js 16 dan TypeScript
- Vercel
- Neon PostgreSQL
- Tailwind CSS 4

## Menjalankan lokal

```bash
pnpm install
cp .env.example .env.local
pnpm db:migrate
pnpm dev
```

Isi seluruh variabel dalam `.env.local` sebelum migrasi dan login. Berkas lingkungan telah diabaikan oleh Git.

## Pemeriksaan

```bash
pnpm lint
pnpm build
```

Dokumentasi arsitektur dan deployment berada di folder [`docs`](./docs).
