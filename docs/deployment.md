# Deployment Vercel dan Neon

## Variabel lingkungan

| Nama | Keterangan |
|---|---|
| `DATABASE_URL` | Connection string PostgreSQL dari integrasi Neon Vercel |
| `SESSION_SECRET` | Rahasia acak minimal 32 karakter |
| `PII_ENCRYPTION_KEY` | Kunci acak minimal 32 karakter untuk enkripsi nomor KK dan NIK; jangan diubah tanpa prosedur migrasi data |
| `OPERATOR_ACCESS_CODE` | Kode akses operator |
| `TREASURER_ACCESS_CODE` | Kode akses bendahara |
| `SUPERVISOR_ACCESS_CODE` | Kode akses pengawas |
| `ADMIN_ACCESS_CODE` | Kode akses administrator |

Jangan menyimpan nilai variabel tersebut di Git. Vercel mengelolanya per lingkungan.

## Langkah

1. Hubungkan repo GitHub ke proyek Vercel.
2. Tambahkan integrasi Neon dan pastikan `DATABASE_URL` tersedia.
3. Tarik variabel lingkungan secara lokal atau gunakan `vercel env run`.
4. Jalankan `node --env-file=.env.local scripts/migrate.mjs` sekali untuk setiap database baru.
5. Jalankan `pnpm build`, lalu deploy ke produksi.
6. Uji `/api/health`, pendaftaran warga, persetujuan operator, portal anggota, semua peran pengelola, pencarian penduduk per RT/RW, penyamaran nomor KK/NIK, setoran, reversal, harga, penjualan, kas, pencairan manfaat, pemeliharaan, dan laporan CSV.

## Pemulihan

Gunakan fitur backup/restore Neon sesuai paket yang aktif. Simpan `PII_ENCRYPTION_KEY` melalui pengelola rahasia Vercel karena data identitas tidak dapat dibaca kembali apabila kunci hilang. Setelah pemulihan, jalankan pemeriksaan jumlah keluarga, penduduk, anggota, setoran, stok, kas, serta audit log sebelum membuka kembali layanan.
