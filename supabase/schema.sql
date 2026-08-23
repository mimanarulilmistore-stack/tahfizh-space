-- Skema kosong untuk pembeli baru (satu lembaga = satu project Supabase).
-- Jalankan di: Supabase Dashboard → SQL Editor → New query → Run
-- Idempoten sejauh praktis (IF NOT EXISTS, DROP POLICY IF EXISTS, CREATE OR REPLACE).
-- Jangan jalankan mass UPDATE data lama di sini — itu hanya untuk patch DB yang sudah jalan.
-- File supabase/fix-*.sql tetap ada sebagai riwayat, bukan sumber untuk setup baru.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- profiles (santri). id BUKAN FK ke auth.users — santri tidak punya akun login.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_lengkap text,
  nis text,
  kode_unik text UNIQUE,
  role text DEFAULT 'santri',
  target_juz integer DEFAULT 30,
  tingkatan text DEFAULT 'dasar',
  no_wa_wali text,
  target_ziyadah_mingguan integer DEFAULT 3,
  target_murajaah_mingguan integer DEFAULT 2,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT profiles_tingkatan_check
    CHECK (tingkatan IS NULL OR tingkatan IN ('dasar', 'menengah', 'tinggi'))
);

COMMENT ON TABLE public.profiles IS
  'Data santri. Satu database = satu lembaga. Semua ustadz yang login melihat semua santri.';
COMMENT ON COLUMN public.profiles.tingkatan IS
  'Tingkatan kelas generik: dasar, menengah, atau tinggi.';
COMMENT ON COLUMN public.profiles.no_wa_wali IS
  'Nomor WhatsApp wali (contoh 0812... atau 62812...). Dipakai untuk buka chat wa.me.';
COMMENT ON COLUMN public.profiles.target_ziyadah_mingguan IS
  'Target jumlah setoran ziyadah per minggu (Senin–Minggu). 0 = tidak ditargetkan.';
COMMENT ON COLUMN public.profiles.target_murajaah_mingguan IS
  'Target jumlah setoran murajaah per minggu (Senin–Minggu). 0 = tidak ditargetkan.';

-- ---------------------------------------------------------------------------
-- setoran_hafalan
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.setoran_hafalan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  santri_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ustadz_id uuid,
  jenis_setoran text,
  nama_surah text,
  ayat_mulai integer,
  ayat_selesai integer,
  juz integer,
  juz_selesai boolean DEFAULT false,
  nilai_kelancaran text,
  nilai_tajwid text,
  catatan text,
  tanggal_setoran date,
  created_at timestamptz DEFAULT now()
);

COMMENT ON COLUMN public.setoran_hafalan.ustadz_id IS
  'ID user Auth ustadz (opsional). Tidak diikat FK ke auth.users.';
COMMENT ON COLUMN public.setoran_hafalan.juz IS 'Nomor juz (1-30) yang disetor.';
COMMENT ON COLUMN public.setoran_hafalan.juz_selesai IS
  'True jika ziyadah ini menandai juz tersebut selesai.';

CREATE INDEX IF NOT EXISTS setoran_hafalan_santri_id_idx
  ON public.setoran_hafalan (santri_id);

-- ---------------------------------------------------------------------------
-- admin_pengumuman (pinned + updated_at trigger)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_pengumuman (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  judul text NOT NULL,
  isi text NOT NULL,
  tingkat text NOT NULL DEFAULT 'info',
  pinned boolean NOT NULL DEFAULT false,
  aktif boolean NOT NULL DEFAULT true,
  tampil_mulai date DEFAULT current_date,
  tampil_sampai date,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.admin_pengumuman IS
  'Pengumuman manual untuk semua admin/ustadz di dashboard.';
COMMENT ON COLUMN public.admin_pengumuman.tingkat IS
  'Level pengumuman: info, penting, atau darurat.';
COMMENT ON COLUMN public.admin_pengumuman.pinned IS
  'True jika pengumuman diprioritaskan di urutan teratas.';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'admin_pengumuman_tingkat_check'
  ) THEN
    ALTER TABLE public.admin_pengumuman
      ADD CONSTRAINT admin_pengumuman_tingkat_check
      CHECK (tingkat IN ('info', 'penting', 'darurat'));
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.set_admin_pengumuman_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_admin_pengumuman_updated_at ON public.admin_pengumuman;
CREATE TRIGGER trg_admin_pengumuman_updated_at
BEFORE UPDATE ON public.admin_pengumuman
FOR EACH ROW
EXECUTE FUNCTION public.set_admin_pengumuman_updated_at();

-- ---------------------------------------------------------------------------
-- RLS: anon TIDAK boleh SELECT semua baris.
-- Portal wali memakai RPC SECURITY DEFINER (satu santri per kode unik).
-- Ustadz terautentikasi mengelola data lembaga ini (satu DB = satu lembaga).
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.setoran_hafalan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_pengumuman ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read santri by kode" ON public.profiles;
DROP POLICY IF EXISTS "Public baca setoran santri" ON public.setoran_hafalan;

DROP POLICY IF EXISTS "Authenticated read profiles" ON public.profiles;
CREATE POLICY "Authenticated read profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated insert santri" ON public.profiles;
CREATE POLICY "Authenticated insert santri"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (role = 'santri');

DROP POLICY IF EXISTS "Authenticated update santri" ON public.profiles;
CREATE POLICY "Authenticated update santri"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (role = 'santri')
  WITH CHECK (role = 'santri');

DROP POLICY IF EXISTS "Authenticated delete santri" ON public.profiles;
CREATE POLICY "Authenticated delete santri"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (role = 'santri');

DROP POLICY IF EXISTS "Authenticated full akses setoran" ON public.setoran_hafalan;
CREATE POLICY "Authenticated full akses setoran"
  ON public.setoran_hafalan
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated full akses admin_pengumuman" ON public.admin_pengumuman;
CREATE POLICY "Authenticated full akses admin_pengumuman"
  ON public.admin_pengumuman
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- RPC portal wali (versi terbaru: tingkatan, target mingguan, juz, tanggal)
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_santri_by_kode(text);

CREATE OR REPLACE FUNCTION public.get_santri_by_kode(p_kode text)
RETURNS TABLE (
  id uuid,
  nama_lengkap text,
  kode_unik text,
  nis text,
  target_juz integer,
  tingkatan text,
  target_ziyadah_mingguan integer,
  target_murajaah_mingguan integer
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.nama_lengkap,
    p.kode_unik,
    p.nis,
    p.target_juz,
    p.tingkatan,
    COALESCE(p.target_ziyadah_mingguan, 3),
    COALESCE(p.target_murajaah_mingguan, 2)
  FROM public.profiles p
  WHERE p.role = 'santri'
    AND upper(trim(p.kode_unik)) = upper(trim(p_kode))
  LIMIT 1;
$$;

DROP FUNCTION IF EXISTS public.get_setoran_by_kode(text);

CREATE OR REPLACE FUNCTION public.get_setoran_by_kode(p_kode text)
RETURNS TABLE (
  id uuid,
  jenis_setoran text,
  nama_surah text,
  juz integer,
  juz_selesai boolean,
  ayat_mulai integer,
  ayat_selesai integer,
  nilai_kelancaran text,
  nilai_tajwid text,
  catatan text,
  tanggal_setoran date,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    s.id,
    s.jenis_setoran,
    s.nama_surah,
    s.juz,
    COALESCE(s.juz_selesai, false) AS juz_selesai,
    s.ayat_mulai,
    s.ayat_selesai,
    s.nilai_kelancaran,
    s.nilai_tajwid,
    s.catatan,
    s.tanggal_setoran,
    s.created_at
  FROM public.setoran_hafalan s
  INNER JOIN public.profiles p ON p.id = s.santri_id
  WHERE p.role = 'santri'
    AND upper(trim(p.kode_unik)) = upper(trim(p_kode))
  ORDER BY COALESCE(s.tanggal_setoran, s.created_at::date) DESC, s.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_santri_by_kode(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_setoran_by_kode(text) TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.setoran_hafalan TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.admin_pengumuman TO authenticated;
REVOKE ALL ON TABLE public.profiles FROM anon, PUBLIC;
REVOKE ALL ON TABLE public.setoran_hafalan FROM anon, PUBLIC;
REVOKE ALL ON TABLE public.admin_pengumuman FROM anon, PUBLIC;
