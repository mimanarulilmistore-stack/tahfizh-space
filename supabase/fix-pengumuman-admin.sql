-- Modul Pengumuman Admin untuk dashboard ustadz.
-- Jalankan di: Supabase Dashboard → SQL Editor → Run

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

-- Tambah kolom pinned jika tabel sudah dibuat versi lama (tanpa pinned)
ALTER TABLE public.admin_pengumuman
  ADD COLUMN IF NOT EXISTS pinned boolean NOT NULL DEFAULT false;

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

ALTER TABLE public.admin_pengumuman ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated full akses admin_pengumuman" ON public.admin_pengumuman;
CREATE POLICY "Authenticated full akses admin_pengumuman"
  ON public.admin_pengumuman
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
