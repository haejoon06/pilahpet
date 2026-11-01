# Arsitektur PilahPET

PilahPET adalah modular monolith berbasis Next.js. Halaman publik dan dashboard berjalan pada Vercel, sedangkan data persisten tersimpan di Neon PostgreSQL yang terhubung melalui `DATABASE_URL`.

## Komponen

- `src/app`: halaman publik, pendaftaran warga, portal anggota, autentikasi, dashboard, dan route handler JSON/CSV.
- `src/lib/auth.ts`: sesi JWT HTTP-only dan pemeriksaan hak akses berbasis peran.
- `src/lib/db.ts`: akses data Neon dengan kueri berparameter.
- `db/migrations`: skema, indeks, seed minimum, dan fungsi transaksi atomik.
- `scripts/migrate.mjs`: migrasi idempoten dengan pencatatan versi skema.

## Peran

| Peran | Kewenangan utama |
|---|---|
| Operator | Pendaftaran warga, anggota, setoran, pembatalan setoran, dan pemeliharaan |
| Bendahara | Harga, penjualan, kas, pencairan manfaat, dan laporan |
| Pengawas | Membaca dashboard agregat, laporan, dan audit |
| Administrator | Seluruh fungsi operasional |

Setiap operasi tulis memeriksa sesi di server. Setoran dan penjualan ditangani fungsi PostgreSQL agar pembaruan transaksi, stok, manfaat, kas, serta audit terjadi dalam satu transaksi.

## Keputusan desain

- Harga disimpan sebagai snapshot pada setoran sehingga histori tidak berubah.
- ID transaksi klien unik mencegah setoran ganda saat sinkronisasi ulang.
- Pembatalan setoran memakai reversal stok dan manfaat, bukan menghapus histori.
- Pendaftaran publik harus disetujui operator sebelum kode anggota dan PIN diterbitkan.
- PIN anggota disimpan sebagai HMAC menggunakan rahasia sesi dan tidak ditampilkan kembali setelah diterbitkan.
- Tabel perangkat dan telemetri sudah tersedia, tetapi fitur sensor dinonaktifkan pada versi pertama.
- NIK tidak dikumpulkan secara default.
