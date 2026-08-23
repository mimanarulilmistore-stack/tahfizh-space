/**
 * Saklar fitur per pembeli (white-label).
 * Default SEMUA NYALA agar situs produksi tidak berubah.
 * Matikan hanya jika env = false | 0 | off (huruf besar/kecil diabaikan).
 */

function isFeatureEnabled(envKey: string): boolean {
  const raw = process.env[envKey];
  if (raw == null || String(raw).trim() === '') return true;
  const v = String(raw).trim().toLowerCase();
  return !(v === 'false' || v === '0' || v === 'off');
}

export const features = {
  /** Menu + /dashboard/pengumuman + widget pengumuman di dashboard */
  pengumuman: isFeatureEnabled('NEXT_PUBLIC_FEATURE_PENGUMUMAN'),
  /** Menu + /dashboard/input-massal */
  inputMassal: isFeatureEnabled('NEXT_PUBLIC_FEATURE_INPUT_MASSAL'),
  /** Menu + /dashboard/cetak-kartu */
  cetakKartu: isFeatureEnabled('NEXT_PUBLIC_FEATURE_CETAK_KARTU'),
  /** Menu + /dashboard/laporan */
  laporan: isFeatureEnabled('NEXT_PUBLIC_FEATURE_LAPORAN'),
  /** Tombol/salin pesan WhatsApp ke wali */
  whatsapp: isFeatureEnabled('NEXT_PUBLIC_FEATURE_WHATSAPP'),
  /** Badge + peta juz di portal wali */
  portalBadge: isFeatureEnabled('NEXT_PUBLIC_FEATURE_PORTAL_BADGE'),
  /** Menu + /dashboard/absensi + rekap absensi portal */
  absensi: isFeatureEnabled('NEXT_PUBLIC_FEATURE_ABSENSI'),
  /** Menu + /dashboard/spp (iuran/SPP bulanan) */
  spp: isFeatureEnabled('NEXT_PUBLIC_FEATURE_SPP'),
} as const;

export type FeatureKey = keyof typeof features;

/** Path dashboard yang bisa diblokir middleware jika fitur mati. */
export const FEATURE_ROUTE_GUARDS: Array<{
  prefix: string;
  enabled: boolean;
}> = [
  { prefix: '/dashboard/pengumuman', enabled: features.pengumuman },
  { prefix: '/dashboard/input-massal', enabled: features.inputMassal },
  { prefix: '/dashboard/cetak-kartu', enabled: features.cetakKartu },
  { prefix: '/dashboard/laporan', enabled: features.laporan },
  { prefix: '/dashboard/absensi', enabled: features.absensi },
  { prefix: '/dashboard/spp', enabled: features.spp },
];

export function isDashboardPathEnabled(pathname: string): boolean {
  for (const guard of FEATURE_ROUTE_GUARDS) {
    if (
      pathname === guard.prefix ||
      pathname.startsWith(`${guard.prefix}/`)
    ) {
      return guard.enabled;
    }
  }
  return true;
}
