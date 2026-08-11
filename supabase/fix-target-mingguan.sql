-- Target mingguan ziyadah / murajaah per santri + RPC portal.
-- Jalankan di: Supabase Dashboard → SQL Editor → Run

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS target_ziyadah_mingguan integer DEFAULT 3,
  ADD COLUMN IF NOT EXISTS target_murajaah_mingguan integer DEFAULT 2;

COMMENT ON COLUMN public.profiles.target_ziyadah_mingguan IS
  'Target jumlah setoran ziyadah per minggu (Senin–Minggu). 0 = tidak ditargetkan.';
COMMENT ON COLUMN public.profiles.target_murajaah_mingguan IS
  'Target jumlah setoran murajaah per minggu (Senin–Minggu). 0 = tidak ditargetkan.';

UPDATE public.profiles
SET
  target_ziyadah_mingguan = COALESCE(target_ziyadah_mingguan, 3),
  target_murajaah_mingguan = COALESCE(target_murajaah_mingguan, 2)
WHERE role = 'santri';

-- RPC santri: sertakan target mingguan
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

-- RPC setoran: sertakan tanggal_setoran untuk hitung minggu
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

GRANT EXECUTE ON FUNCTION public.get_santri_by_kode(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_setoran_by_kode(text) TO anon, authenticated;
