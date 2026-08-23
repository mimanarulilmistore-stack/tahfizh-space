/**
 * Kit merek white-label.
 * Default = merek situs saat ini (jangan diubah agar produksi tidak berubah).
 * Override per pembeli lewat env NEXT_PUBLIC_* di Vercel.
 */

function envOr(key: string, fallback: string): string {
  const v = process.env[key];
  if (typeof v === 'string' && v.trim()) return v.trim();
  return fallback;
}

/** Nama tampilan penuh (header, beranda, metadata). */
export const BRAND_NAME = envOr(
  'NEXT_PUBLIC_BRAND_NAME',
  'Tahfizh Manarul Ilmi'
);

/** Nama pendek (kartu, header sempit). */
export const BRAND_NAME_SHORT = envOr(
  'NEXT_PUBLIC_BRAND_SHORT',
  'Manarul Ilmi'
);

export const BRAND_TAGLINE = envOr(
  'NEXT_PUBLIC_BRAND_TAGLINE',
  "Sistem Mutaba'ah & Manajemen Hafalan Al-Qur'an"
);

/** Nama lembaga di kop rapor. */
export const BRAND_INSTITUTION = envOr(
  'NEXT_PUBLIC_BRAND_INSTITUTION',
  "Lembaga Pendidikan Tahfizh Al-Qur'an"
);

/** Tanda tangan pesan WhatsApp ke wali. */
export const BRAND_TEAM_SIGNATURE = envOr(
  'NEXT_PUBLIC_BRAND_SIGNATURE',
  'Tim Tahfizh Manarul Ilmi'
);

/** URL publik aplikasi (cadangan QR jika window belum tersedia). */
export const BRAND_APP_URL = envOr('NEXT_PUBLIC_APP_URL', '');

/** Logo untuk latar terang / favicon. */
export const BRAND_LOGO_ON_LIGHT = envOr(
  'NEXT_PUBLIC_LOGO_URL',
  envOr('NEXT_PUBLIC_LOGO_ON_LIGHT', '/logo-mio-academy-on-light.png')
);

/** Logo untuk latar gelap (login/admin). */
export const BRAND_LOGO_ON_DARK = envOr(
  'NEXT_PUBLIC_LOGO_ON_DARK',
  '/logo-mio-academy-on-dark-v2.png'
);

export const BRAND_LOGO_SRC = BRAND_LOGO_ON_LIGHT;

/** Warna merek utama (QR, aksen CSS). */
export const BRAND_COLOR = envOr('NEXT_PUBLIC_BRAND_COLOR', '#047857');

export const brand = {
  name: BRAND_NAME,
  shortName: BRAND_NAME_SHORT,
  tagline: BRAND_TAGLINE,
  institution: BRAND_INSTITUTION,
  signature: BRAND_TEAM_SIGNATURE,
  appUrl: BRAND_APP_URL,
  logoOnLight: BRAND_LOGO_ON_LIGHT,
  logoOnDark: BRAND_LOGO_ON_DARK,
  color: BRAND_COLOR,
} as const;
