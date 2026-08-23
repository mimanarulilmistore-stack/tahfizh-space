-- =============================================================================
-- schema.sql — skema kosong siap tempel untuk pembeli white-label baru
-- Jalankan di: Supabase Dashboard → SQL Editor → New query → Run (seluruh file)
--
-- JANGAN salin data produksi. File fix-*.sql adalah riwayat patch DB lama;
-- pembeli baru cukup menjalankan file ini saja.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) profiles (santri) — tanpa FK ke auth.users (santri bukan akun login)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_lengkap text,
  nis text,
  kode_unik text,
  role text NOT NULL DEFAULT 'santri',
  target_juz integer DEFAULT 30,
  tingkatan text DEFAULT 'dasar',
  no_wa_wali text,
  target_ziyadah_mingguan integer DEFAULT 3,
  target_murajaah_mingguan integer DEFAULT 2,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profiles IS
  'Profil santri (role=santri). Bukan akun Auth; id digenerate aplikasi.';

COMMENT ON COLUMN public.profiles.tingkatan IS
  'Tingkatan kelas generik: dasar, menengah, atau tinggi';

COMMENT ON COLUMN public.profiles.no_wa_wali IS
  'Nomor WhatsApp wali (contoh 0812... atau 62812...). Dipakai untuk wa.me.';

COMMENT ON COLUMN public.profiles.target_ziyadah_mingguan IS
  'Target jumlah setoran ziyadah per minggu (Senin–Minggu). 0 = tidak ditargetkan.';

COMMENT ON COLUMN public.profiles.target_murajaah_mingguan IS
  'Target jumlah setoran murajaah per minggu (Senin–Minggu). 0 = tidak ditargetkan.';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_tingkatan_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_tingkatan_check
      CHECK (
        tingkatan IS NULL
        OR tingkatan IN ('dasar', 'menengah', 'tinggi')
      );
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_kode_unik_unique
  ON public.profiles (kode_unik)
  WHERE kode_unik IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 2) setoran_hafalan
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.setoran_hafalan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  santri_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
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
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON COLUMN public.setoran_hafalan.ustadz_id IS
  'ID user Auth ustadz (opsional, tanpa FK wajib).';

COMMENT ON COLUMN public.setoran_hafalan.juz IS 'Nomor juz (1-30) yang disetor';
COMMENT ON COLUMN public.setoran_hafalan.juz_selesai IS
  'True jika ziyadah ini menandai juz tersebut selesai';

CREATE INDEX IF NOT EXISTS idx_setoran_hafalan_santri_id
  ON public.setoran_hafalan (santri_id);

CREATE INDEX IF NOT EXISTS idx_setoran_hafalan_tanggal
  ON public.setoran_hafalan (tanggal_setoran);

-- -----------------------------------------------------------------------------
-- 3) admin_pengumuman
-- -----------------------------------------------------------------------------
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

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'admin_pengumuman_tingkat_check'
  ) THEN
    ALTER TABLE public.admin_pengumuman
      ADD CONSTRAINT admin_pengumuman_tingkat_check
      CHECK (tingkat IN ('info', 'penting', 'darurat'));
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.set_admin_pengumuman_updated_at()
RETURNS trigger
LANGUAGE plpgsql
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

-- -----------------------------------------------------------------------------
-- 4) absensi_santri
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.absensi_santri (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  santri_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tanggal date NOT NULL DEFAULT current_date,
  status text NOT NULL DEFAULT 'hadir',
  catatan text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.absensi_santri IS
  'Kehadiran santri per tanggal. Direkap per tingkatan lewat join ke profiles.';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'absensi_santri_status_check'
  ) THEN
    ALTER TABLE public.absensi_santri
      ADD CONSTRAINT absensi_santri_status_check
      CHECK (status IN ('hadir', 'sakit', 'izin', 'alpha'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'absensi_santri_santri_tanggal_key'
  ) THEN
    ALTER TABLE public.absensi_santri
      ADD CONSTRAINT absensi_santri_santri_tanggal_key
      UNIQUE (santri_id, tanggal);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_absensi_santri_tanggal
  ON public.absensi_santri (tanggal);

CREATE INDEX IF NOT EXISTS idx_absensi_santri_santri_id
  ON public.absensi_santri (santri_id);

CREATE OR REPLACE FUNCTION public.set_absensi_santri_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_absensi_santri_updated_at ON public.absensi_santri;
CREATE TRIGGER trg_absensi_santri_updated_at
BEFORE UPDATE ON public.absensi_santri
FOR EACH ROW
EXECUTE FUNCTION public.set_absensi_santri_updated_at();

-- -----------------------------------------------------------------------------
-- 5) SPP bulanan
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.spp_pengaturan (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  nominal_default numeric(12, 0) NOT NULL DEFAULT 150000,
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.spp_pengaturan IS
  'Pengaturan SPP bulanan (nominal default seragam untuk semua santri).';

INSERT INTO public.spp_pengaturan (id, nominal_default)
VALUES (1, 150000)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.spp_pembayaran (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  santri_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  periode text NOT NULL,
  nominal numeric(12, 0) NOT NULL DEFAULT 150000,
  status text NOT NULL DEFAULT 'belum',
  tanggal_bayar date,
  catatan text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.spp_pembayaran IS
  'Status SPP bulanan per santri. periode format YYYY-MM.';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'spp_pembayaran_status_check'
  ) THEN
    ALTER TABLE public.spp_pembayaran
      ADD CONSTRAINT spp_pembayaran_status_check
      CHECK (status IN ('lunas', 'belum'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'spp_pembayaran_periode_check'
  ) THEN
    ALTER TABLE public.spp_pembayaran
      ADD CONSTRAINT spp_pembayaran_periode_check
      CHECK (periode ~ '^\d{4}-\d{2}$');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'spp_pembayaran_santri_periode_key'
  ) THEN
    ALTER TABLE public.spp_pembayaran
      ADD CONSTRAINT spp_pembayaran_santri_periode_key
      UNIQUE (santri_id, periode);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_spp_pembayaran_periode
  ON public.spp_pembayaran (periode);

CREATE INDEX IF NOT EXISTS idx_spp_pembayaran_santri_id
  ON public.spp_pembayaran (santri_id);

CREATE OR REPLACE FUNCTION public.set_spp_pembayaran_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_spp_pembayaran_updated_at ON public.spp_pembayaran;
CREATE TRIGGER trg_spp_pembayaran_updated_at
BEFORE UPDATE ON public.spp_pembayaran
FOR EACH ROW
EXECUTE FUNCTION public.set_spp_pembayaran_updated_at();

-- -----------------------------------------------------------------------------
-- 6) RLS — satu lembaga per database; authenticated = ustadz penuh
--    anon TIDAK boleh SELECT semua baris (portal hanya lewat RPC)
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.setoran_hafalan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_pengumuman ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.absensi_santri ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spp_pengaturan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spp_pembayaran ENABLE ROW LEVEL SECURITY;

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

DROP POLICY IF EXISTS "Authenticated full akses absensi_santri" ON public.absensi_santri;
CREATE POLICY "Authenticated full akses absensi_santri"
  ON public.absensi_santri
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated full akses spp_pengaturan" ON public.spp_pengaturan;
CREATE POLICY "Authenticated full akses spp_pengaturan"
  ON public.spp_pengaturan
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated full akses spp_pembayaran" ON public.spp_pembayaran;
CREATE POLICY "Authenticated full akses spp_pembayaran"
  ON public.spp_pembayaran
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Hapus kebijakan publik longgar jika sempat ada dari patch lama
DROP POLICY IF EXISTS "Public read santri by kode" ON public.profiles;
DROP POLICY IF EXISTS "Public baca setoran santri" ON public.setoran_hafalan;

-- -----------------------------------------------------------------------------
-- 7) RPC portal wali (SECURITY DEFINER) — hanya 1 anak per kode unik
-- -----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_santri_by_kode(text);

CREATE FUNCTION public.get_santri_by_kode(p_kode text)
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

CREATE FUNCTION public.get_setoran_by_kode(p_kode text)
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

DROP FUNCTION IF EXISTS public.get_absensi_by_kode(text);

CREATE FUNCTION public.get_absensi_by_kode(p_kode text)
RETURNS TABLE (
  tanggal date,
  status text,
  catatan text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    a.tanggal,
    a.status,
    a.catatan
  FROM public.absensi_santri a
  INNER JOIN public.profiles p ON p.id = a.santri_id
  WHERE p.role = 'santri'
    AND upper(trim(p.kode_unik)) = upper(trim(p_kode))
  ORDER BY a.tanggal DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_santri_by_kode(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_setoran_by_kode(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_absensi_by_kode(text) TO anon, authenticated;
