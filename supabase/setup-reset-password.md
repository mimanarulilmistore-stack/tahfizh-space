-- Catatan setup Reset Password (bukan migrasi tabel).
-- Lakukan di Supabase Dashboard setelah deploy fitur reset.

-- 1) Authentication → URL Configuration
--    Site URL: https://ALAMAT-SITUS-ANDA  (contoh: https://nama-proyek.vercel.app)
--    Redirect URLs (tambahkan keduanya):
--      https://ALAMAT-SITUS-ANDA/auth/callback
--      http://localhost:3000/auth/callback

-- 2) Authentication → Emails → pastikan template "Reset Password" aktif
--    (default Supabase sudah menyertakan tautan {{ .ConfirmationURL }})

-- 3) Uji alur:
--    Login → Lupa password? → masukkan email → buka email → set sandi baru
