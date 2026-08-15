-- Izinkan portal wali melihat absensi ANAKNYA saja (via PIN/kode unik).
-- Jalankan di: Supabase Dashboard → SQL Editor → Run
-- Syarat: tabel absensi_santri sudah ada (fix-absensi.sql).

-- RPC: ambil absensi hanya untuk santri dengan kode unik tersebut
CREATE OR REPLACE FUNCTION public.get_absensi_by_kode(p_kode text)
RETURNS TABLE (
  tanggal date,
  status text,
  catatan text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    a.tanggal,
    a.status,
    a.catatan
  FROM public.absensi_santri a
  INNER JOIN public.profiles p ON p.id = a.santri_id
  WHERE p.role = 'santri'
    AND upper(trim(p.kode_unik)) = upper(trim(p_kode))
  ORDER BY a.tanggal DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_absensi_by_kode(text) TO anon, authenticated;
