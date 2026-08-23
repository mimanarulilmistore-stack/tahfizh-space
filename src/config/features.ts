/**
 * Feature flags v1. Default ON.
 * OFF hanya jika env tepat: false / 0 / off (huruf besar-kecil diabaikan).
 *
 * Aman untuk Edge/middleware: hanya process.env.NEXT_PUBLIC_* (tanpa API Node).
 */

function isFlagOn(value: string | undefined): boolean {
  if (value == null || value.trim() === '') return true;
  const normalized = value.trim().toLowerCase();
  return normalized !== 'false' && normalized !== '0' && normalized !== 'off';
}

export const features = {
  pengumuman: isFlagOn(process.env.NEXT_PUBLIC_FEATURE_PENGUMUMAN),
  inputMassal: isFlagOn(process.env.NEXT_PUBLIC_FEATURE_INPUT_MASSAL),
  cetakKartu: isFlagOn(process.env.NEXT_PUBLIC_FEATURE_CETAK_KARTU),
  laporan: isFlagOn(process.env.NEXT_PUBLIC_FEATURE_LAPORAN),
  whatsapp: isFlagOn(process.env.NEXT_PUBLIC_FEATURE_WHATSAPP),
  portalBadge: isFlagOn(process.env.NEXT_PUBLIC_FEATURE_PORTAL_BADGE),
} as const;

type FeatureFlag = keyof typeof features;

const DASHBOARD_FEATURE_PREFIXES: { prefix: string; flag: FeatureFlag }[] = [
  { prefix: '/dashboard/pengumuman', flag: 'pengumuman' },
  { prefix: '/dashboard/input-massal', flag: 'inputMassal' },
  { prefix: '/dashboard/cetak-kartu', flag: 'cetakKartu' },
  { prefix: '/dashboard/laporan', flag: 'laporan' },
];

/** True jika path dashboard dimatikan oleh flag (untuk middleware). */
export function isDisabledDashboardRoute(pathname: string): boolean {
  return DASHBOARD_FEATURE_PREFIXES.some(({ prefix, flag }) => {
    if (features[flag]) return false;
    return pathname === prefix || pathname.startsWith(`${prefix}/`);
  });
}
