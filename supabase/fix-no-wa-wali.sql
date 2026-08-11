-- Nomor WhatsApp wali santri (untuk tautan wa.me manual, tanpa API).
-- Jalankan di: Supabase Dashboard → SQL Editor → Run

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS no_wa_wali text;

COMMENT ON COLUMN public.profiles.no_wa_wali IS
  'Nomor WhatsApp wali (contoh 0812... atau 62812...). Dipakai untuk buka chat wa.me.';
