-- Patch: tambah kolom pinned (jika tabel admin_pengumuman sudah ada tanpa pinned).
-- Jalankan di: Supabase Dashboard → SQL Editor → Run

ALTER TABLE public.admin_pengumuman
  ADD COLUMN IF NOT EXISTS pinned boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.admin_pengumuman.pinned IS
  'True jika pengumuman diprioritaskan di urutan teratas.';
