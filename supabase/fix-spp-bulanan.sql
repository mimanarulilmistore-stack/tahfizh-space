-- Modul SPP bulanan (pembayaran seragam) untuk dashboard admin.
-- Jalankan di: Supabase Dashboard → SQL Editor → Run
--
-- Satu baris = status SPP satu santri untuk satu bulan (YYYY-MM).
-- Nominal default disimpan di spp_pengaturan (1 baris).

-- Pengaturan global (hanya 1 baris)
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

-- Catatan pembayaran per santri per bulan
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

COMMENT ON COLUMN public.spp_pembayaran.status IS
  'Status pembayaran: lunas atau belum.';

COMMENT ON COLUMN public.spp_pembayaran.periode IS
  'Bulan tagihan dalam format YYYY-MM (contoh: 2026-08).';

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

ALTER TABLE public.spp_pengaturan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spp_pembayaran ENABLE ROW LEVEL SECURITY;

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
