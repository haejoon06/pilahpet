# Arsitektur SiPilah PET

SiPilah PET adalah modular monolith berbasis Next.js. Halaman publik dan dashboard berjalan pada Vercel, sedangkan data persisten tersimpan di Neon PostgreSQL yang terhubung melalui `DATABASE_URL`.

## Komponen

- `src/app`: halaman publik, autentikasi, dashboard, dan route handler JSON.
- `src/lib/auth.ts`: sesi JWT HTTP-only dan pemeriksaan hak akses berbasis peran.
- `src/lib/db.ts`: akses data Neon dengan kueri berparameter.
- `db/migrations`: skema, indeks, seed minimum, dan fungsi transaksi atomik.
- `scripts/migrate.mjs`: migrasi idempoten dengan pencatatan versi skema.

## Peran

| Peran | Kewenangan utama |
|---|---|
| Operator | Anggota dan setoran |
| Bendahara | Harga dan penjualan |
| Pengawas | Membaca dashboard agregat |
| Administrator | Seluruh fungsi operasional |

Setiap operasi tulis memeriksa sesi di server. Setoran dan penjualan ditangani fungsi PostgreSQL agar pembaruan transaksi, stok, manfaat, kas, serta audit terjadi dalam satu transaksi.

## Keputusan desain

- Harga disimpan sebagai snapshot pada setoran sehingga histori tidak berubah.
- ID transaksi klien unik mencegah setoran ganda saat sinkronisasi ulang.
- Pembatalan kelak harus memakai reversal, bukan menghapus histori.
- Tabel perangkat dan telemetri sudah tersedia, tetapi fitur sensor dinonaktifkan pada versi pertama.
- NIK tidak dikumpulkan secara default.
