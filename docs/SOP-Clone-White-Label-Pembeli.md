# SOP Clone White-Label — Aplikasi Mutaba'ah Tahfizh

**Panduan pasang untuk pembeli berikutnya**  
Satu lembaga = satu situs + satu database kosong  

Versi: Agustus 2026 · Repo: `tahfizh-space` · File Word: `docs/SOP-Clone-White-Label-Pembeli.docx`

---

## 1. Apa yang Anda jual / pasang

Ini **bukan** sistem banyak lembaga dalam satu database. Setiap pembeli mendapat:

- Satu proyek **Vercel** (alamat web sendiri)
- Satu proyek **Supabase** (database kosong)
- Merek sendiri (nama, logo opsional) lewat Environment Variables
- Saklar fitur (misalnya matikan SPP/iuran) **tanpa menghapus kode**

### Yang TIDAK ikut diberikan

- Data santri / setoran / SPP / absensi lembaga lain
- Kunci API proyek Supabase produksi yang lama
- File `.env.local` atau `service_role` key

---

## 2. Persiapan sebelum mulai

- Akun Supabase (boleh akun yang sama; **proyek harus baru**)
- Akun Vercel terhubung ke GitHub repo `tahfizh-space` (boleh akun yang sama; **proyek harus baru**)
- Catat data pembeli: nama lembaga, email ustadz admin, apakah SPP/absensi dimatikan
- Di komputer: file `supabase/schema.sql` dari repo

---

## 3. Langkah demi langkah

### Langkah 1 — Buat proyek Supabase baru

1. Login dashboard Supabase → **New project**
2. **Name:** misalnya nama-lembaga-pembeli
3. **Database password:** buat kuat, simpan di notes
4. **Region:** pilih yang dekat (contoh Singapore)
5. **Create project** → tunggu sampai siap

### Langkah 2 — Jalankan skema database kosong

1. Di proyek baru: **SQL Editor** → **New query**
2. Buka file repo: `supabase/schema.sql`
3. Salin **SEMUA** isi file → tempel di SQL Editor
4. Klik **Run**
5. Pastikan sukses (tidak ada error merah)

> File `supabase/fix-*.sql` hanya untuk database lama. Pembeli baru cukup `schema.sql`.

### Langkah 3 — Buat akun ustadz (login admin)

1. **Authentication** → **Users** → **Add user** → **Create new user**
2. Isi email + password admin lembaga
3. Centang **Auto Confirm User** (jika ada) agar langsung aktif
4. **Create user** — simpan email/sandi di notes untuk pembeli

### Langkah 4 — Atur URL Auth (sementara localhost)

1. **Authentication** → **URL Configuration**
2. **Site URL:** `http://localhost:3000`
3. **Redirect URLs:** tambah `http://localhost:3000/auth/callback`
4. **Save**

Nanti diganti/ditambah URL Vercel setelah situs jadi (Langkah 7).

### Langkah 5 — Salin kunci API Supabase

1. **Project Settings** → **API** (atau **API Keys**)
2. Salin **Project URL** → ini `NEXT_PUBLIC_SUPABASE_URL`
3. Salin **anon public** key → ini `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. **JANGAN** salin / bagikan `service_role`

Project URL biasanya: `https://XXXX.supabase.co`  
Di tab Legacy: tombol **Copy** di samping anon. Project URL sering ada di tab Publishable / Settings General (Reference ID).

### Langkah 6 — Buat & deploy proyek Vercel

1. Vercel → **Add New** → **Project**
2. Import repo GitHub: `tahfizh-space` (branch production biasanya `main`)
3. **Project Name:** sesuai lembaga
4. Isi **Environment Variables** (Production + Preview):

| Name | Contoh Value | Wajib? |
|------|--------------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` | Ya |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOi...` (anon) | Ya |
| `NEXT_PUBLIC_APP_URL` | `https://nama.vercel.app` | Sangat disarankan |
| `NEXT_PUBLIC_BRAND_NAME` | `Tahfizh Nama Lembaga` | Disarankan |
| `NEXT_PUBLIC_BRAND_SIGNATURE` | `Tim Tahfizh Nama Lembaga` | Opsional |
| `NEXT_PUBLIC_BRAND_INSTITUTION` | `Lembaga Pendidikan ...` | Opsional |
| `NEXT_PUBLIC_FEATURE_SPP` | `false` | Jika tanpa iuran |
| `NEXT_PUBLIC_FEATURE_ABSENSI` | `false` | Jika tanpa absensi |

5. **Deploy** → tunggu status **Ready**
6. Catat URL produksi, contoh: `https://nama-lembaga.vercel.app`

**Tentang `NEXT_PUBLIC_*`:**

- Aman untuk nama merek & saklar fitur (tampil di browser)
- Setelah menambah/ubah env, **wajib Redeploy**
- Nilai matikan fitur: `false` / `0` / `off`

### Langkah 7 — Pasang URL produksi di Supabase

1. Kembali ke Supabase proyek pembeli
2. **Authentication** → **URL Configuration**
3. **Site URL:** `https://nama-lembaga.vercel.app`
4. **Redirect URLs** tambah: `https://nama-lembaga.vercel.app/auth/callback`
5. Boleh tetap menyimpan localhost untuk uji lokal
6. **Save**

### Langkah 8 — Uji login

1. Buka `https://nama-lembaga.vercel.app`
2. Login Ustadz dengan email/sandi langkah 3
3. Pastikan masuk **Dashboard**

### Langkah 9 — Tambah santri uji

1. Di Dashboard → **Tambah Santri**
2. Isi nama (contoh: Santri Uji)
3. Simpan → catat **PIN / kode unik**

### Langkah 10 — Uji portal wali

1. Buka `/portal` atau tombol **Masuk via Kode Unik**
2. Masukkan PIN santri uji
3. Pastikan halaman anak terbuka

Jika langkah 8–10 sukses, clone siap dipakai lembaga.

---

## 4. Saklar fitur (kurangi modul tanpa hapus kode)

Default semua fitur **NYALA**. Matikan per pembeli di Vercel Environment Variables, lalu **Redeploy**.

| Environment Variable | Modul yang dimatikan |
|----------------------|----------------------|
| `NEXT_PUBLIC_FEATURE_SPP=false` | Menu & halaman SPP / iuran |
| `NEXT_PUBLIC_FEATURE_ABSENSI=false` | Absensi + rekap absensi portal/rapor |
| `NEXT_PUBLIC_FEATURE_PENGUMUMAN=false` | Pengumuman |
| `NEXT_PUBLIC_FEATURE_INPUT_MASSAL=false` | Input setoran massal |
| `NEXT_PUBLIC_FEATURE_CETAK_KARTU=false` | Cetak PIN / QR |
| `NEXT_PUBLIC_FEATURE_LAPORAN=false` | Laporan & Excel |
| `NEXT_PUBLIC_FEATURE_WHATSAPP=false` | Tombol WA ke wali |
| `NEXT_PUBLIC_FEATURE_PORTAL_BADGE=false` | Badge & peta juz di portal |

**Jangan hapus file kode** hanya untuk satu pembeli. Pakai saklar.

Inti yang tidak dimatikan: login ustadz, daftar/tambah santri, input setoran satu-satu, portal PIN.

---

## 5. Ganti merek setelah situs sudah jalan

1. Vercel → proyek pembeli → **Settings** → **Environment Variables**
2. Ubah `NEXT_PUBLIC_BRAND_NAME` (dan variabel merek lain jika perlu)
3. **Redeploy**
4. Hard refresh: `Ctrl+Shift+R` / `Cmd+Shift+R`

---

## 6. Checklist cepat tiap pembeli

- [ ] Proyek Supabase baru
- [ ] `schema.sql` dijalankan sukses
- [ ] 1 user ustadz dibuat
- [ ] URL + anon key disalin
- [ ] Proyek Vercel baru + env diisi
- [ ] Deploy Ready
- [ ] Site URL + Redirect callback di Supabase = domain Vercel
- [ ] Login dashboard OK
- [ ] Santri uji + portal PIN OK
- [ ] Merek benar di beranda & header admin
- [ ] Saklar SPP/absensi sesuai kesepakatan

---

## 7. Masalah umum & solusi

### Merek beranda sudah benar, header admin masih lama / menu SPP masih kelihatan

- Pastikan kode terbaru sudah di `main`
- Pastikan env Production terisi, lalu Redeploy
- Hard refresh / Incognito

### Login gagal / lupa sandi tidak jalan

- Cek Site URL & Redirect URLs di Supabase
- Cek email/sandi di Authentication → Users

### Portal PIN kosong / error

- Pastikan `schema.sql` sudah dijalankan (termasuk RPC)
- Pastikan env Supabase di Vercel mengarah ke proyek yang sama

### Peringatan build (tanda seru kuning)

- Biasanya warning, bukan error
- Yang penting status akhir: **Ready**

---

## 8. Referensi di repo

| File | Isi |
|------|-----|
| `docs/CLONE.md` | Panduan singkat |
| `docs/SOP-Clone-White-Label-Pembeli.docx` | Versi Word (buka di Microsoft Word / Google Docs) |
| `.env.example` | Daftar semua variabel |
| `supabase/schema.sql` | Skema kosong pembeli baru |
| `src/config/brand.ts` | Kit merek |
| `src/config/features.ts` | Saklar fitur |

---

## 9. Contoh env siap tempel (tanpa iuran)

```
NEXT_PUBLIC_SUPABASE_URL=https://XXXX.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_APP_URL=https://nama-lembaga.vercel.app
NEXT_PUBLIC_BRAND_NAME=Tahfizh Nama Lembaga
NEXT_PUBLIC_BRAND_SIGNATURE=Tim Tahfizh Nama Lembaga
NEXT_PUBLIC_FEATURE_SPP=false
```

---

## 10. Catatan bisnis singkat

- Putuskan lisensi: situs terpasang saja, atau juga kode sumber
- Semua ustadz yang login melihat semua santri (satu lembaga per database)
- Tidak perlu Supabase Storage untuk operasi dasar

---

*Simpan file ini dan ikuti checklist tiap ada pembeli baru.*
