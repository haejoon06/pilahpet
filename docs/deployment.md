# Deployment Vercel dan Neon

## Variabel lingkungan

| Nama | Keterangan |
|---|---|
| `DATABASE_URL` | Connection string PostgreSQL dari integrasi Neon Vercel |
| `SESSION_SECRET` | Rahasia acak minimal 32 karakter |
| `OPERATOR_ACCESS_CODE` | Kode akses operator |
| `TREASURER_ACCESS_CODE` | Kode akses bendahara |
| `SUPERVISOR_ACCESS_CODE` | Kode akses pengawas |
| `ADMIN_ACCESS_CODE` | Kode akses administrator |

Jangan menyimpan nilai variabel tersebut di Git. Vercel mengelolanya per lingkungan.

## Langkah

1. Hubungkan repo GitHub ke proyek Vercel.
2. Tambahkan integrasi Neon dan pastikan `DATABASE_URL` tersedia.
3. Tarik variabel lingkungan secara lokal atau gunakan `vercel env run`.
4. Jalankan `pnpm db:migrate` sekali untuk setiap database baru.
5. Jalankan `pnpm build`, lalu deploy ke produksi.
6. Uji `/api/health`, login semua peran, setoran, harga, dan penjualan.

## Pemulihan

Gunakan fitur backup/restore Neon sesuai paket yang aktif. Setelah pemulihan, jalankan pemeriksaan jumlah anggota, setoran, stok, kas, serta audit log sebelum membuka kembali layanan.
