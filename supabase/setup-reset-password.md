-- Catatan setup Reset Password (bukan migrasi tabel).
-- Lakukan di Supabase Dashboard setelah deploy fitur reset.

-- Ganti DOMAIN-ANDA dengan URL Vercel / domain kustom pembeli
-- (contoh: https://nama-lembaga.vercel.app). Jangan menyalin URL lembaga lain.

-- 1) Authentication → URL Configuration
--    Site URL: https://DOMAIN-ANDA
--    Redirect URLs (tambahkan keduanya):
--      https://DOMAIN-ANDA/auth/callback
--      http://localhost:3000/auth/callback

-- 2) Authentication → Emails → pastikan template "Reset Password" aktif
--    (default Supabase sudah menyertakan tautan {{ .ConfirmationURL }})

-- 3) Uji alur:
--    Login → Lupa password? → masukkan email → buka email → set sandi baru
