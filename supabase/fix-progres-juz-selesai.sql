-- Kolom & RPC untuk progres juz akurat (tandai juz selesai).
-- Jalankan di: Supabase Dashboard → SQL Editor → Run

ALTER TABLE public.setoran_hafalan
  ADD COLUMN IF NOT EXISTS juz integer,
  ADD COLUMN IF NOT EXISTS juz_selesai boolean DEFAULT false;

COMMENT ON COLUMN public.setoran_hafalan.juz IS 'Nomor juz (1-30) yang disetor';
COMMENT ON COLUMN public.setoran_hafalan.juz_selesai IS 'True jika ziyadah ini menandai juz tersebut selesai';

-- Perbarui RPC portal agar mengembalikan juz + juz_selesai
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
    s.created_at
  FROM public.setoran_hafalan s
  INNER JOIN public.profiles p ON p.id = s.santri_id
  WHERE p.role = 'santri'
    AND upper(trim(p.kode_unik)) = upper(trim(p_kode))
  ORDER BY s.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_setoran_by_kode(text) TO anon, authenticated;
