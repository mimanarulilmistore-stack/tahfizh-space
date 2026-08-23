# Panduan clone white-label (per pembeli)

Satu pembeli = **satu proyek Vercel + satu proyek Supabase kosong**.  
Jangan salin data santri, setoran, atau kunci API lembaga lain.

## Yang dibawa

- Kode aplikasi (repo / zip)
- [`supabase/schema.sql`](../supabase/schema.sql) — skema kosong
- [`.env.example`](../.env.example) — daftar variabel
- Logo pembeli (opsional) di folder `public/`

## Yang tidak dibawa

- `.env.local` / kunci Supabase produksi
- Folder `.vercel`
- Data santri, absensi, SPP, pengumuman dari database lama

## Langkah pasang (Anda atau pembeli)

### 1. Supabase baru

1. Buat proyek di [supabase.com](https://supabase.com).
2. Buka **SQL Editor** → New query.
3. Tempel seluruh isi `supabase/schema.sql` → **Run**.
4. **Authentication → Users** → buat 1 akun ustadz (email + sandi).
5. **Authentication → URL Configuration**
   - **Site URL:** `https://alamat-vercel-pembeli`
   - **Redirect URLs:**  
     `https://alamat-vercel-pembeli/auth/callback`  
     `http://localhost:3000/auth/callback`

### 2. Vercel baru

1. Buat proyek Vercel dari repo yang sama (atau unggah zip).
2. Isi Environment Variables (Production + Preview):

| Variabel | Wajib | Keterangan |
|----------|-------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ya | Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ya | anon / public key |
| `NEXT_PUBLIC_APP_URL` | disarankan | URL situs setelah deploy |
| `NEXT_PUBLIC_BRAND_NAME` | opsional | Nama lembaga di UI |
| `NEXT_PUBLIC_BRAND_SHORT` | opsional | Nama pendek |
| `NEXT_PUBLIC_BRAND_TAGLINE` | opsional | Tagline footer |
| `NEXT_PUBLIC_BRAND_SIGNATURE` | opsional | Tanda tangan WA |
| `NEXT_PUBLIC_BRAND_INSTITUTION` | opsional | Kop rapor |
| `NEXT_PUBLIC_LOGO_URL` | opsional | Path logo latar terang |
| `NEXT_PUBLIC_LOGO_ON_DARK` | opsional | Path logo latar gelap |
| `NEXT_PUBLIC_BRAND_COLOR` | opsional | Hex warna merek (QR) |

3. Deploy.

### 3. Uji asap

1. Buka beranda → nama merek benar.
2. Login ustadz → dashboard.
3. Tambah 1 santri uji → catat PIN.
4. Input 1 setoran.
5. Portal wali `/portal` → masukkan PIN → data anak muncul.
6. (Opsional) Cetak PIN / QR, lupa sandi email.

## Saklar fitur (kurangi modul per pembeli)

Default **semua nyala**. Untuk mematikan, set env ke `false` (atau `0` / `off`), lalu redeploy:

| Env | Modul |
|-----|--------|
| `NEXT_PUBLIC_FEATURE_SPP=false` | Menu & halaman SPP / iuran |
| `NEXT_PUBLIC_FEATURE_ABSENSI=false` | Menu absensi + rekap absensi portal/rapor |
| `NEXT_PUBLIC_FEATURE_PENGUMUMAN=false` | Menu & widget pengumuman |
| `NEXT_PUBLIC_FEATURE_INPUT_MASSAL=false` | Input setoran massal |
| `NEXT_PUBLIC_FEATURE_CETAK_KARTU=false` | Cetak PIN / QR |
| `NEXT_PUBLIC_FEATURE_LAPORAN=false` | Laporan & Excel |
| `NEXT_PUBLIC_FEATURE_WHATSAPP=false` | Tombol kirim/salin WA ke wali |
| `NEXT_PUBLIC_FEATURE_PORTAL_BADGE=false` | Badge & peta juz di portal wali |

**Jangan hapus file kode** untuk satu pembeli. Matikan saklar saja agar update produk utama tetap mudah disalin.

Contoh pembeli tanpa iuran:

```
NEXT_PUBLIC_FEATURE_SPP=false
```

Menu SPP hilang; membuka `/dashboard/spp` diarahkan ke dashboard.

## Logo lembaga (PNG transparan)

1. Simpan file sumber ke `public/`, mis. `public/logo-rtmi-makassar-source.png`.
2. Jalankan:

```bash
python3 scripts/process-brand-logo.py public/logo-rtmi-makassar-source.png --slug logo-rtmi-makassar
```

3. Commit 3 file hasil (`*-source.png`, `*-on-light.png`, `*-on-dark.png`).
4. Di Vercel pembeli, set env:

```
NEXT_PUBLIC_LOGO_URL=/logo-rtmi-makassar-on-light.png
NEXT_PUBLIC_LOGO_ON_LIGHT=/logo-rtmi-makassar-on-light.png
NEXT_PUBLIC_LOGO_ON_DARK=/logo-rtmi-makassar-on-dark.png
```

5. Redeploy. Logo header memakai ukuran 40 / 72 / 112 px (otomatis dari `BrandLogo`).

## Catatan penting

- Semua ustadz yang login melihat **semua** santri (satu lembaga per database).
- Tidak perlu Storage / bucket (Excel & QR diunduh di browser).
- File `supabase/fix-*.sql` hanya untuk database lama yang sudah jalan; **pembeli baru hanya `schema.sql`**.
- Inti yang tidak bisa dimatikan: login, daftar/tambah santri, input setoran satu-satu, portal PIN.

## Lokal (pengembang)

```bash
cp .env.example .env.local
# isi URL + anon key Supabase
npm install
npm run dev
```
