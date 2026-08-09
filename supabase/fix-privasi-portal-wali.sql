-- Privasi portal wali: anon tidak bisa list semua santri.
-- Hanya bisa ambil 1 santri (+ setorannya) lewat kode unik via RPC.
-- Jalankan di: Supabase Dashboard → SQL Editor → Run

-- 1) Hapus kebijakan publik yang terlalu longgar
DROP POLICY IF EXISTS "Public read santri by kode" ON public.profiles;
DROP POLICY IF EXISTS "Public baca setoran santri" ON public.setoran_hafalan;

-- Pastikan ustadz (authenticated) tetap bisa baca semua
DROP POLICY IF EXISTS "Authenticated read profiles" ON public.profiles;
CREATE POLICY "Authenticated read profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated full akses setoran" ON public.setoran_hafalan;
CREATE POLICY "Authenticated full akses setoran"
  ON public.setoran_hafalan
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 2) RPC: ambil 1 santri by kode unik
CREATE OR REPLACE FUNCTION public.get_santri_by_kode(p_kode text)
RETURNS TABLE (
  id uuid,
  nama_lengkap text,
  kode_unik text,
  nis text,
  target_juz integer
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.nama_lengkap, p.kode_unik, p.nis, p.target_juz
  FROM public.profiles p
  WHERE p.role = 'santri'
    AND upper(trim(p.kode_unik)) = upper(trim(p_kode))
  LIMIT 1;
$$;

-- 3) RPC: ambil setoran hanya untuk santri dengan kode tersebut
CREATE OR REPLACE FUNCTION public.get_setoran_by_kode(p_kode text)
RETURNS TABLE (
  id uuid,
  jenis_setoran text,
  nama_surah text,
  ayat_mulai integer,
  ayat_selesai integer,
  nilai_kelancaran text,
  nilai_tajwid text,
  catatan text,
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
    s.ayat_mulai,
    s.ayat_selesai,
    s.nilai_kelancaran,
    s.nilai_tajwid,
    s.catatan,
    s.created_at
  FROM public.setoran_hafalan s
  INNER JOIN public.profiles p ON p.id = s.santri_id
  WHERE p.role = 'santri'
    AND upper(trim(p.kode_unik)) = upper(trim(p_kode))
  ORDER BY s.created_at DESC;
$$;

-- 4) Izinkan anon & authenticated memanggil RPC (bukan SELECT semua baris)
GRANT EXECUTE ON FUNCTION public.get_santri_by_kode(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_setoran_by_kode(text) TO anon, authenticated;
