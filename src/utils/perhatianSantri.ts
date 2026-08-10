import { computeJuzProgress, type SetoranItem } from '@/src/utils/badgeCalculator';

export type AlasanPerhatianId =
  | 'belum_setor'
  | 'lama_tidak_setor'
  | 'murajaah_kosong';

export type AlasanPerhatian = {
  id: AlasanPerhatianId;
  label: string;
  detail: string;
  severity: 'tinggi' | 'sedang' | 'rendah';
};

export type SetoranUntukPerhatian = SetoranItem & {
  santri_id?: string;
  tanggal_setoran?: string | null;
  created_at?: string | null;
};

export type SantriUntukPerhatian = {
  id: string;
  nama_lengkap: string;
  kode_unik: string;
  tingkatan?: string | null;
  created_at?: string | null;
};

export type ItemPerhatian = {
  santri: SantriUntukPerhatian;
  reasons: AlasanPerhatian[];
  lastSetoranAt: string | null;
  daysSinceLastSetoran: number | null;
  totalZiyadah: number;
  totalMurajaah: number;
  /** Semakin tinggi = semakin perlu didahulukan */
  score: number;
};

const HARI_LAMA_TIDAK_SETOR = 7;
const MIN_ZIYADAH_UNTUK_MURAJAAH = 3;

function toTime(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const t = new Date(raw).getTime();
  return Number.isNaN(t) ? null : t;
}

function getLastSetoranAt(rows: SetoranUntukPerhatian[]): string | null {
  let best: number | null = null;
  let bestRaw: string | null = null;

  for (const row of rows) {
    const candidates = [row.tanggal_setoran, row.created_at];
    for (const raw of candidates) {
      const t = toTime(raw);
      if (t == null) continue;
      if (best == null || t > best) {
        best = t;
        bestRaw = raw || null;
      }
    }
  }

  return bestRaw;
}

function daysBetween(fromIso: string | null, now = new Date()): number | null {
  const t = toTime(fromIso);
  if (t == null) return null;
  const diff = now.getTime() - t;
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Deteksi santri yang perlu perhatian ustadz.
 * Kriteria (bisa overlap):
 * - Belum pernah setor
 * - Lama tidak setor (>= 7 hari)
 * - Sudah ada ziyadah (>=3) tapi belum ada murajaah
 */
export function detectSantriPerluPerhatian(
  santriList: SantriUntukPerhatian[],
  setoranBySantri: Record<string, SetoranUntukPerhatian[]>,
  now = new Date()
): ItemPerhatian[] {
  const items: ItemPerhatian[] = [];

  for (const santri of santriList) {
    const rows = setoranBySantri[santri.id] || [];
    const progress = computeJuzProgress(rows);
    const lastSetoranAt = getLastSetoranAt(rows);
    const daysSinceLastSetoran =
      rows.length === 0
        ? daysBetween(santri.created_at || null, now)
        : daysBetween(lastSetoranAt, now);

    const reasons: AlasanPerhatian[] = [];
    let score = 0;

    if (progress.totalSetoran === 0) {
      const hariSejakDaftar = daysSinceLastSetoran ?? 0;
      reasons.push({
        id: 'belum_setor',
        label: 'Belum pernah setor',
        detail:
          hariSejakDaftar > 0
            ? `Terdaftar ${hariSejakDaftar} hari, belum ada setoran`
            : 'Belum ada setoran tercatat',
        severity: 'tinggi',
      });
      score += 100 + Math.min(hariSejakDaftar, 60);
    } else if (
      daysSinceLastSetoran != null &&
      daysSinceLastSetoran >= HARI_LAMA_TIDAK_SETOR
    ) {
      reasons.push({
        id: 'lama_tidak_setor',
        label: 'Lama tidak setor',
        detail: `Setoran terakhir ${daysSinceLastSetoran} hari lalu`,
        severity: daysSinceLastSetoran >= 14 ? 'tinggi' : 'sedang',
      });
      score += 50 + Math.min(daysSinceLastSetoran, 90);
    }

    if (
      progress.totalZiyadah >= MIN_ZIYADAH_UNTUK_MURAJAAH &&
      progress.totalMurajaah === 0
    ) {
      reasons.push({
        id: 'murajaah_kosong',
        label: 'Murajaah belum ada',
        detail: `${progress.totalZiyadah} ziyadah tanpa murajaah`,
        severity: 'rendah',
      });
      score += 20 + progress.totalZiyadah;
    }

    if (reasons.length === 0) continue;

    items.push({
      santri,
      reasons,
      lastSetoranAt,
      daysSinceLastSetoran,
      totalZiyadah: progress.totalZiyadah,
      totalMurajaah: progress.totalMurajaah,
      score,
    });
  }

  return items.sort((a, b) => b.score - a.score);
}

export const KRITERIA_PERHATIAN_TEXT = [
  `Belum pernah setor`,
  `Lama tidak setor (≥ ${HARI_LAMA_TIDAK_SETOR} hari)`,
  `Ada ≥ ${MIN_ZIYADAH_UNTUK_MURAJAAH} ziyadah tapi belum murajaah`,
];
