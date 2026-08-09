-- Perbaikan agar fitur "Tambah Santri Baru" bisa berjalan di Supabase.
-- Jalankan seluruh skrip ini di: Supabase Dashboard → SQL Editor → New query → Run

-- 1) Pastikan kolom yang dipakai aplikasi ada
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS nama_lengkap text,
  ADD COLUMN IF NOT EXISTS nis text,
  ADD COLUMN IF NOT EXISTS kode_unik text,
  ADD COLUMN IF NOT EXISTS target_juz integer DEFAULT 30,
  ADD COLUMN IF NOT EXISTS role text DEFAULT 'santri';

-- 2) id boleh digenerate otomatis (santri tidak punya akun auth)
ALTER TABLE public.profiles
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 3) Lepas FK ke auth.users jika ada (penyebab insert santri gagal)
DO $$
DECLARE
  fk_name text;
BEGIN
  SELECT tc.constraint_name INTO fk_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
   AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
   AND ccu.table_schema = tc.table_schema
  WHERE tc.table_schema = 'public'
    AND tc.table_name = 'profiles'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'id'
    AND ccu.table_name = 'users'
  LIMIT 1;

  IF fk_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT %I', fk_name);
  END IF;
END $$;

-- 4) Kode unik harus unik
CREATE UNIQUE INDEX IF NOT EXISTS profiles_kode_unik_unique
  ON public.profiles (kode_unik)
  WHERE kode_unik IS NOT NULL;

-- 5) Aktifkan RLS + kebijakan untuk ustadz (authenticated)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated read profiles" ON public.profiles;
CREATE POLICY "Authenticated read profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Baca publik by kode unik (portal PIN / QR)
DROP POLICY IF EXISTS "Public read santri by kode" ON public.profiles;
CREATE POLICY "Public read santri by kode"
  ON public.profiles
  FOR SELECT
  TO anon, authenticated
  USING (role = 'santri');

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

-- 6) Kebijakan dasar untuk tabel setoran (agar input hafalan juga aman)
ALTER TABLE public.setoran_hafalan ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated full akses setoran" ON public.setoran_hafalan;
CREATE POLICY "Authenticated full akses setoran"
  ON public.setoran_hafalan
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public baca setoran santri" ON public.setoran_hafalan;
CREATE POLICY "Public baca setoran santri"
  ON public.setoran_hafalan
  FOR SELECT
  TO anon, authenticated
  USING (true);
