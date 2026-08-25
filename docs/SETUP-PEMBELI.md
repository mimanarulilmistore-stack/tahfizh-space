# Panduan setup pembeli (Supabase + Vercel milik customer)

Panduan ini untuk model: **pembeli punya akun sendiri**, supaya kuota Free / tagihan di akun Anda tidak bertambah.

| Layanan | Punya siapa |
|---------|-------------|
| GitHub (kode aplikasi) | **Anda** (penjual) |
| Supabase (database + login) | **Pembeli** |
| Vercel (hosting situs) | **Pembeli** |

Satu pembeli = **1 proyek Supabase kosong + 1 proyek Vercel**.  
Jangan salin data santri atau kunci API lembaga lain.

---

## Persiapan dari pihak Anda (penjual)

Siapkan dulu sebelum mengarahkan pembeli:

1. Pastikan pembeli sudah coba **demo** Anda dan setuju beli.
2. Siapkan file/skema yang akan dikirim:
   - isi file [`supabase/schema.sql`](../supabase/schema.sql) (atau tautan unduhan)
   - daftar variabel dari [`.env.example`](../.env.example)
   - (opsional) logo lembaga pembeli
3. Putuskan cara pembeli dapat kode di Vercel (pilih salah satu):

| Cara | Kapan dipakai |
|------|----------------|
| **A. Undang ke GitHub** | Pembeli Import repo Anda di Vercel (paling rapi untuk update) |
| **B. Deploy Hook / Anda yang bantu Import** | Anda bantu sekali di panggilan video |
| **C. Kirim zip** | Darurat saja; update fitur lebih ribet |

**Disarankan: Cara A** — undang email GitHub pembeli sebagai *collaborator* (akses baca), lalu mereka Import di Vercel.

---

## Langkah 1 — Pembeli buat akun & proyek Supabase

1. Buka [https://supabase.com](https://supabase.com) → **Start your project** / daftar.
2. Buat organisasi (boleh nama lembaga mereka).
3. **New project**:
   - Nama: misalnya `nama-lembaga-tahfizh`
   - Database password: simpan di tempat aman (jangan dikirim ke chat sembarangan)
   - Region: pilih yang dekat (mis. Singapore)
4. Tunggu proyek siap (hijau / Active).

### 1b. Jalankan skema kosong

1. Di Supabase: **SQL Editor** → **New query**.
2. Tempel **seluruh** isi `supabase/schema.sql`.
3. Klik **Run**. Pastikan tidak ada error merah.
4. (Opsional) **Table Editor** → pastikan tabel muncul (`profiles`, `setoran_hafalan`, dll.).

### 1c. Buat akun ustadz / admin

1. **Authentication** → **Users** → **Add user**.
2. Isi email + password (boleh email fiktif jika di-centang **Auto Confirm User**).
3. Simpan email & password untuk login dashboard.

### 1d. Ambil kunci API (nanti diisi di Vercel)

1. **Project Settings** → **API**.
2. Salin:
   - **Project URL** → nanti jadi `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → nanti jadi `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Jangan bagikan **service_role** key ke sembarang orang.

---

## Langkah 2 — Pembeli buat akun & proyek Vercel

1. Buka [https://vercel.com](https://vercel.com) → daftar (boleh pakai GitHub yang sama).
2. **Add New…** → **Project**.
3. **Import** repository aplikasi (repo yang Anda undang / yang berisi kode Tahfizh Space).
4. Sebelum Deploy, buka **Environment Variables** dan isi minimal:

| Nama variabel | Isi dari mana |
|---------------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public |
| `NEXT_PUBLIC_APP_URL` | URL Vercel nanti, contoh `https://nama-proyek.vercel.app` (boleh diisi setelah deploy pertama, lalu redeploy) |

5. (Opsional merek) isi juga:

| Nama variabel | Contoh |
|---------------|--------|
| `NEXT_PUBLIC_BRAND_NAME` | Nama lembaga |
| `NEXT_PUBLIC_BRAND_SHORT` | Nama pendek |
| `NEXT_PUBLIC_BRAND_TAGLINE` | Tagline footer |
| `NEXT_PUBLIC_BRAND_SIGNATURE` | Nama di pesan WA |
| `NEXT_PUBLIC_BRAND_INSTITUTION` | Teks kop rapor |
| `NEXT_PUBLIC_BRAND_COLOR` | `#047857` |

6. (Opsional) matikan modul yang tidak dipakai, contoh:

```
NEXT_PUBLIC_FEATURE_SPP=false
```

Daftar lengkap saklar: lihat [`CLONE.md`](CLONE.md).

7. Klik **Deploy**. Tunggu selesai → catat URL (contoh `https://nama-proyek.vercel.app`).

8. Jika `NEXT_PUBLIC_APP_URL` masih kosong / salah: edit env → isi URL final → **Redeploy**.

---

## Langkah 3 — Hubungkan Supabase ke URL Vercel (wajib)

Tanpa ini, login / lupa password bisa gagal.

1. Kembali ke Supabase → **Authentication** → **URL Configuration**.
2. **Site URL:**  
   `https://nama-proyek.vercel.app`  
   (ganti dengan URL Vercel pembeli yang sebenarnya)
3. **Redirect URLs** (tambahkan keduanya):

```
https://nama-proyek.vercel.app/auth/callback
http://localhost:3000/auth/callback
```

4. Simpan.

---

## Langkah 4 — Uji asap (5–10 menit)

Centang bersama pembeli:

1. Buka beranda Vercel → nama merek benar.
2. `/login` → masuk dengan akun ustadz dari Langkah 1c.
3. Dashboard terbuka.
4. Tambah 1 santri uji → catat PIN.
5. Input 1 setoran.
6. Buka `/portal` → masukkan PIN → data anak muncul.
7. (Opsional) Cetak PIN/QR, coba lupa password (hanya jika email aktif).

Jika semua lolos → setup selesai. Serahkan URL + akun ustadz ke pengelola lembaga.

---

## Yang Anda lakukan vs yang pembeli lakukan

| Tugas | Penjual | Pembeli |
|-------|---------|---------|
| Punya / update kode di GitHub | Ya | Tidak wajib |
| Daftar Supabase + buat proyek | Bantu arahkan | Ya |
| Jalankan `schema.sql` | Boleh dampingi | Ya |
| Daftar Vercel + Import + Deploy | Boleh dampingi | Ya |
| Isi env Supabase URL/Key | Boleh dampingi | Ya |
| Biaya Free Supabase / Vercel | Tidak memakai kuota Anda | Pakai kuota mereka |
| Update fitur aplikasi nanti | Push ke GitHub → Vercel pembeli Redeploy / auto | Terima update |

---

## Update fitur di kemudian hari

1. Anda push perubahan ke GitHub.
2. Jika Vercel pembeli terhubung ke repo yang sama → biasanya **otomatis deploy**.
3. Jika tidak otomatis → pembeli (atau Anda yang punya akses Vercel mereka) klik **Redeploy**.
4. **Jangan** menjalankan ulang `schema.sql` utuh di database yang sudah berisi data, kecuali ada panduan migrasi khusus (`supabase/fix-*.sql`).

---

## Masalah umum

| Gejala | Cek |
|--------|-----|
| Login gagal / Invalid credentials | User Auth sudah dibuat? Auto Confirm? Email/sandi benar? |
| Halaman putih / error config | Env `NEXT_PUBLIC_SUPABASE_URL` & `ANON_KEY` sudah di Vercel + Redeploy? |
| Lupa password tidak jalan | Site URL + Redirect URLs di Supabase sudah cocok dengan domain Vercel? |
| Nama merek masih default | Env `NEXT_PUBLIC_BRAND_*` belum diisi / belum Redeploy |
| Menu SPP masih ada padahal diminta mati | `NEXT_PUBLIC_FEATURE_SPP=false` + Redeploy |

---

## Ringkas untuk dikirim ke pembeli (teks siap salin)

```
Setup singkat (akun Anda sendiri):

1) Buat proyek GRATIS di supabase.com
2) SQL Editor → tempel schema.sql → Run
3) Authentication → Users → buat akun ustadz (Auto Confirm)
4) Settings → API → salin Project URL + anon key
5) Buat proyek di vercel.com → Import repo aplikasi
6) Isi Environment Variables:
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   NEXT_PUBLIC_APP_URL=https://nama-proyek-anda.vercel.app
7) Deploy
8) Di Supabase → Authentication → URL Configuration:
   Site URL = URL Vercel Anda
   Redirect = https://URL-VERCEL/auth/callback
9) Uji: login → tambah santri → portal PIN

Data & tagihan hosting ada di akun Anda. Kami yang rawat update fitur di GitHub.
```

Detail teknis tambahan (logo, saklar fitur, clone): [`CLONE.md`](CLONE.md).
