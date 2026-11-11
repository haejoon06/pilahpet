# Deployment Vercel dan Neon

## Variabel lingkungan

| Nama | Keterangan |
|---|---|
| `DATABASE_URL` | Connection string PostgreSQL dari integrasi Neon Vercel |
| `SESSION_SECRET` | Rahasia acak minimal 32 karakter |
| `PII_ENCRYPTION_KEY` | Kunci acak minimal 32 karakter untuk enkripsi nomor KK dan NIK; jangan diubah tanpa prosedur migrasi data |
| `IOT_DEVICE_KEY` | Kunci rahasia perangkat sensor untuk endpoint `/api/iot/bottle-events` |
| `VOUCHER_RATE_PER_KG` | Nilai voucher per kilogram; opsional, default `2000` |
| `CHAIRPERSON_ACCESS_CODE` | Kode akses Ketua RT |
| `SECRETARY_ACCESS_CODE` | Kode akses Sekretaris |
| `TREASURER_ACCESS_CODE` | Kode akses bendahara |
| `ADMIN_ACCESS_CODE` | Kode akses Admin |
| `WASTE_MANAGER_ACCESS_CODE` | Kode akses Pengelola Sampah Botol |

Jangan menyimpan nilai variabel tersebut di Git. Vercel mengelolanya per lingkungan.

## Langkah

1. Hubungkan repo GitHub ke proyek Vercel.
2. Tambahkan integrasi Neon dan pastikan `DATABASE_URL` tersedia.
3. Tarik variabel lingkungan secara lokal atau gunakan `vercel env run`.
4. Jalankan `node --env-file=.env.local scripts/migrate.mjs` untuk menerapkan migrasi baru, termasuk tabel periode kepengurusan RT.
5. Jalankan `pnpm build`, lalu deploy ke produksi.
6. Uji `/api/health`, semua peran, sinkronisasi identitas wilayah, periode pengurus, wilayah otomatis pada KK, pembuatan akun warga, kas RT, perangkat sensor, QR, klaim voucher, pembuatan surat, kop dan penandatangan Word, serta penyamaran nomor KK/NIK.

## Pemulihan

Gunakan fitur backup/restore Neon sesuai paket yang aktif. Simpan `PII_ENCRYPTION_KEY` melalui pengelola rahasia Vercel karena data identitas tidak dapat dibaca kembali apabila kunci hilang. Setelah pemulihan, jalankan pemeriksaan jumlah keluarga, penduduk, anggota, setoran, stok, kas, serta audit log sebelum membuka kembali layanan.
