-- Modul Absensi (kehadiran) santri per tingkatan untuk dashboard ustadz.
-- Jalankan di: Supabase Dashboard → SQL Editor → Run
--
-- Satu baris = kehadiran satu santri pada satu tanggal.
-- Tingkatan tidak disimpan di tabel ini; direkap lewat join ke profiles.tingkatan
-- (konsisten dengan setoran_hafalan yang juga tidak menyimpan tingkatan).

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

COMMENT ON COLUMN public.absensi_santri.status IS
  'Status kehadiran: hadir, sakit, izin, atau alpha.';

-- Batasi nilai status yang valid (abaikan jika constraint sudah ada)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'absensi_santri_status_check'
  ) THEN
    ALTER TABLE public.absensi_santri
      ADD CONSTRAINT absensi_santri_status_check
      CHECK (status IN ('hadir', 'sakit', 'izin', 'alpha'));
  END IF;
END $$;

-- Maksimal satu catatan absensi per santri per tanggal (agar bisa di-upsert)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'absensi_santri_santri_tanggal_key'
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

ALTER TABLE public.absensi_santri ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated full akses absensi_santri" ON public.absensi_santri;
CREATE POLICY "Authenticated full akses absensi_santri"
  ON public.absensi_santri
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
