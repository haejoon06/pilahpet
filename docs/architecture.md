# Arsitektur RT SMART

RT SMART adalah modular monolith berbasis Next.js. Portal publik, panel pengurus, dan portal warga berjalan pada Vercel, sedangkan data persisten tersimpan di Neon PostgreSQL.

## Komponen

- `src/app`: portal publik, portal warga, panel pengurus per modul, autentikasi, endpoint IoT, dan route handler.
- `src/lib/auth.ts`: sesi JWT HTTP-only dan pemeriksaan hak akses berbasis peran.
- `src/lib/db.ts`: akses data Neon dengan kueri berparameter.
- `db/migrations`: skema, indeks, seed minimum, dan fungsi transaksi atomik.
- `scripts/migrate.mjs`: migrasi idempoten dengan pencatatan versi skema.

## Peran

| Peran | Kewenangan utama |
|---|---|
| Petugas RT | Data warga, akun warga, surat, dan operasional pilah botol |
| Bendahara Pilah Botol | Membaca operasional dan transaksi pilah botol |
| Pengawas | Membaca data dan laporan tanpa melakukan perubahan |
| Administrator RT | Seluruh modul, pengaturan RT, serta pengelolaan kas RT |
| Warga | Profil, pengajuan surat, klaim QR, riwayat botol, dan voucher miliknya |

Setiap operasi tulis memeriksa sesi di server. Klaim voucher ditangani fungsi PostgreSQL agar QR hanya dapat dipakai sekali dan pencatatan voucher berlangsung atomik.

## Keputusan desain

- Akun warga hanya dibuat pengurus dari data penduduk; pendaftaran publik dinonaktifkan.
- PIN warga disimpan sebagai HMAC dan hanya ditampilkan saat akun diterbitkan.
- Nomor KK dan NIK disimpan dengan AES-256-GCM, memiliki blind index untuk deteksi duplikasi, dan ditampilkan tersamarkan.
- Kas RT terpisah dari transaksi ekonomi pilah botol dan hanya dapat diubah Administrator RT.
- Perangkat sensor memakai kunci khusus, menghasilkan QR sekali pakai yang berlaku 15 menit.
- Surat Word mengambil data dari kependudukan hanya setelah pengajuan disetujui; nomor otomatis dibuat berurutan per lokasi dan tahun melalui fungsi PostgreSQL dengan penguncian transaksi.
- Identitas kop dan Ketua RT dikelola melalui halaman Pengaturan RT.
