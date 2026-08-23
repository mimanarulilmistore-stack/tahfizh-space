# Panduan kloning white-label (satu pembeli = satu salinan)

Dokumen ini untuk menyiapkan **salinan aplikasi** bagi satu lembaga. Bukan multi-tenant: **satu project Supabase = satu lembaga**. Semua ustadz yang login melihat **semua santri** di database itu.

**Jangan** menyalin data produksi, `.env.local`, atau kunci API lembaga lain.

Halaman **iuran / SPP / tagihan belum ada** di aplikasi ini. Mematikan “iuran” tidak mengubah apa pun (tidak ada menu iuran yang perlu disembunyikan).

Tidak perlu bucket Storage.

---

## 1. Project Supabase baru

1. Buat project baru di [Supabase](https://supabase.com) (satu pembeli = satu project).
2. Buka **SQL Editor**.
3. Salin seluruh isi `supabase/schema.sql` (bukan file `fix-*.sql`).
4. Jalankan (Run). Tunggu selesai tanpa error.
5. File `supabase/fix-*.sql` hanya riwayat perbaikan database lama. Pembeli baru cukup `schema.sql`.

## 2. Akun ustadz

1. Di Supabase: **Authentication → Users → Add user**.
2. Isi email + kata sandi ustadz (boleh centang auto-confirm).
3. Ustadz masuk lewat `/login` di aplikasi. Santri **tidak** punya akun; mereka pakai PIN di `/portal`.

## 3. URL Auth (wajib agar login & reset sandi jalan)

Di **Authentication → URL Configuration**:

- **Site URL:** `https://DOMAIN-PEMBELI.vercel.app` (ganti dengan domain Vercel pembeli)
- **Redirect URLs** (tambahkan):
  - `https://DOMAIN-PEMBELI.vercel.app/auth/callback`
  - `http://localhost:3000/auth/callback` (untuk uji di komputer)

Jangan memakai domain lembaga lain.

## 4. Project Vercel baru

1. Import **salinan repo** ini ke GitHub/Git milik pembeli, lalu buat project Vercel **baru** (jangan menempel ke project produksi yang sudah jalan).
2. Isi Environment Variables (lihat `.env.example` dan bagian di bawah).
3. Deploy.
4. Opsional: pasang domain kustom, lalu samakan Site URL + Redirect di Supabase.

## 5. Variabel lingkungan

Isi di Vercel (Production + Preview sesuai kebutuhan):

| Variabel | Isi |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL Supabase pembeli |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` `public` key pembeli (**bukan** service role) |
| `NEXT_PUBLIC_APP_URL` | URL publik, contoh `https://nama-lembaga.vercel.app` |
| `NEXT_PUBLIC_BRAND_NAME` | Nama tampilan, default `Tahfizh Space` |
| `NEXT_PUBLIC_BRAND_TAGLINE` | Slogan singkat |
| `NEXT_PUBLIC_BRAND_SIGNATURE` | Penutup pesan WA, default `Tim Tahfizh Space` |
| `NEXT_PUBLIC_BRAND_INSTITUTION` | Kop rapor |
| `NEXT_PUBLIC_LOGO_URL` | Opsional. Kosong = `/brand-logo.png`. Letakkan file logo di `public/brand-logo.png` |

**Jangan** mengisi `service_role` key di Vercel untuk aplikasi ini.

Logo: taruh berkas di `public/brand-logo.png`. Jika file tidak ada atau gagal dimuat, aplikasi memakai ikon buku/perisai.

## 6. Feature flags (semua default NYALA)

Flag **mati** hanya jika nilainya tepat: `false`, `0`, atau `off` (huruf besar-kecil tidak penting). Kosong atau `true` = nyala.

| Variabel | Jika dimatikan |
|---|---|
| `NEXT_PUBLIC_FEATURE_PENGUMUMAN` | Menu + halaman pengumuman disembunyikan; widget pengumuman di dashboard hilang |
| `NEXT_PUBLIC_FEATURE_INPUT_MASSAL` | Menu + halaman input massal disembunyikan; tombol di halaman input tunggal hilang |
| `NEXT_PUBLIC_FEATURE_CETAK_KARTU` | Menu + halaman cetak kartu PIN disembunyikan |
| `NEXT_PUBLIC_FEATURE_LAPORAN` | Menu + halaman laporan/Excel disembunyikan |
| `NEXT_PUBLIC_FEATURE_WHATSAPP` | Tombol salin/kirim WhatsApp ke wali disembunyikan |
| `NEXT_PUBLIC_FEATURE_PORTAL_BADGE` | Lencana & peta juz di portal wali disembunyikan (PIN, progres, ringkasan bulanan tetap ada) |

Yang **selalu nyala:** login ustadz, daftar/tambah santri, input setoran satu-satu, portal PIN wali.

Contoh mematikan laporan untuk satu pembeli di Vercel:

```text
NEXT_PUBLIC_FEATURE_LAPORAN=false
```

Lalu **Redeploy** agar nilai `NEXT_PUBLIC_*` masuk ke bundle.

Tidak ada flag iuran — modul itu belum dibuat.

## 7. Uji asap (smoke test)

Setelah deploy:

1. Buka beranda: nama brand sesuai env (atau tetap Tahfizh Space jika env brand kosong).
2. `/login` → masuk sebagai ustadz → sampai `/dashboard`.
3. Tambah 1 santri → input 1 setoran.
4. Buka `/portal`, masukkan PIN → hanya data anak itu yang tampil.
5. Jika suatu flag `false`, menu terkait hilang; mengetik URL-nya harus kembali ke `/dashboard`.

## 8. Reset kata sandi

Ikuti `supabase/setup-reset-password.md` dengan **domain pembeli**, bukan domain contoh.
