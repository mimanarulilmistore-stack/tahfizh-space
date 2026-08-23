/**
 * Branding white-label. Default = Tahfizh Space (situs saat ini tidak berubah).
 * Pembeli cukup isi NEXT_PUBLIC_BRAND_* di Vercel.
 *
 * Logo: default /brand-logo.png (file di public/).
 * Ganti lewat NEXT_PUBLIC_LOGO_URL. Jika file gagal dimuat, ikon Lucide dipakai.
 */

function pick(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

const name = pick(process.env.NEXT_PUBLIC_BRAND_NAME, 'Tahfizh Space');

export const brand = {
  name,
  /** Nama rapat untuk header beranda/portal, default TahfizhSpace */
  compactName: name.replace(/\s+/g, ''),
  /** Header dashboard / kop rapor, default TAHFIZH SPACE */
  shortName: name.toUpperCase(),
  tagline: pick(
    process.env.NEXT_PUBLIC_BRAND_TAGLINE,
    "Platform Mutaba'ah & Setoran Hafalan Modern"
  ),
  signature: pick(process.env.NEXT_PUBLIC_BRAND_SIGNATURE, 'Tim Tahfizh Space'),
  institution: pick(
    process.env.NEXT_PUBLIC_BRAND_INSTITUTION,
    "Lembaga Pendidikan Tahfizh Al-Qur'an Modern & Terpadu"
  ),
  appUrl: pick(process.env.NEXT_PUBLIC_APP_URL, ''),
  /** Path publik atau URL. Default file di public/brand-logo.png */
  logoUrl: pick(process.env.NEXT_PUBLIC_LOGO_URL, '/brand-logo.png'),
  /** Warna QR & aksen utama — sama dengan --brand di globals.css */
  qrFg: '#047857',
} as const;

/** Origin publik: window dulu, lalu NEXT_PUBLIC_APP_URL. Jangan hardcode domain produksi. */
export function getPublicOrigin(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return brand.appUrl;
}
