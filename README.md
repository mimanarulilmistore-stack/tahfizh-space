# Tahfizh Space / white-label mutaba'ah

Aplikasi Next.js + Supabase untuk setoran hafalan, portal wali (PIN/QR), absensi, SPP, laporan, dan pengumuman.

## Menjalankan lokal

```bash
cp .env.example .env.local
# isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## Clone untuk pembeli (white-label)

**Disarankan (Supabase + Vercel milik pembeli):**  
**[docs/SETUP-PEMBELI.md](docs/SETUP-PEMBELI.md)** — panduan step-by-step agar kuota Free / tagihan di akun Anda tidak bertambah.

Detail teknis (saklar fitur, logo, catatan skema): **[docs/CLONE.md](docs/CLONE.md)**

Ringkas: proyek Supabase pembeli → `schema.sql` → akun ustadz → proyek Vercel pembeli → isi env merek + saklar fitur.

Contoh matikan SPP/iuran untuk satu pembeli:

```
NEXT_PUBLIC_FEATURE_SPP=false
```

## Stack

- Next.js 16 (App Router)
- Supabase Auth + Postgres
- Tailwind CSS 4
