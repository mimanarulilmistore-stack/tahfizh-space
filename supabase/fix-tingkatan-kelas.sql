-- Tingkatan kelas generik: dasar | menengah | tinggi
-- (bisa dipakai setara SMP/SMA tanpa menyebut jenjang sekolah)
-- Jalankan di: Supabase Dashboard → SQL Editor → Run

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tingkatan text;

COMMENT ON COLUMN public.profiles.tingkatan IS
  'Tingkatan kelas generik: dasar, menengah, atau tinggi';

-- Santri lama tanpa nilai: default Dasar agar langsung masuk leaderboard
UPDATE public.profiles
SET tingkatan = 'dasar'
WHERE role = 'santri'
  AND (tingkatan IS NULL OR trim(tingkatan) = '');

ALTER TABLE public.profiles
  ALTER COLUMN tingkatan SET DEFAULT 'dasar';

-- Batasi nilai yang valid (abaikan jika constraint sudah ada)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_tingkatan_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_tingkatan_check
      CHECK (
        tingkatan IS NULL
        OR tingkatan IN ('dasar', 'menengah', 'tinggi')
      );
  END IF;
END $$;

-- Perbarui RPC portal agar mengembalikan tingkatan
DROP FUNCTION IF EXISTS public.get_santri_by_kode(text);

CREATE FUNCTION public.get_santri_by_kode(p_kode text)
RETURNS TABLE (
  id uuid,
  nama_lengkap text,
  kode_unik text,
  nis text,
  target_juz integer,
  tingkatan text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.nama_lengkap, p.kode_unik, p.nis, p.target_juz, p.tingkatan
  FROM public.profiles p
  WHERE p.role = 'santri'
    AND upper(trim(p.kode_unik)) = upper(trim(p_kode))
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_santri_by_kode(text) TO anon, authenticated;
