import { computeJuzProgress, getSantriLevel } from '@/src/utils/badgeCalculator';

export type SetoranRingkasan = {
  id: string;
  jenis_setoran: string;
  nama_surah?: string | null;
  juz?: number | null;
  juz_selesai?: boolean | null;
  ayat_mulai?: number | null;
  ayat_selesai?: number | null;
  nilai_kelancaran?: string | null;
  nilai_tajwid?: string | null;
  catatan?: string | null;
  tanggal_setoran?: string | null;
  created_at: string;
};

export type RingkasanBulananResult = {
  year: number;
  month: number; // 1-12
  labelBulan: string;
  totalSetoran: number;
  totalZiyadah: number;
  totalMurajaah: number;
  juzSelesaiBulanIni: number[];
  juzSelesaiCount: number;
  hariAktif: number;
  catatanUstadz: Array<{ tanggal: string; teks: string; jenis: string }>;
  setoranTerakhir: SetoranRingkasan | null;
  rows: SetoranRingkasan[];
  overallJuzSelesai: number;
  overallLevel: string;
};

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

export function toYearMonthKey(year: number, month: number) {
  return `${year}-${pad2(month)}`;
}

export function parseYearMonthKey(key: string): { year: number; month: number } | null {
  const m = /^(\d{4})-(\d{2})$/.exec(key);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  if (!Number.isFinite(year) || month < 1 || month > 12) return null;
  return { year, month };
}

export function getCurrentYearMonth(now = new Date()) {
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export function shiftYearMonth(year: number, month: number, delta: number) {
  const d = new Date(year, month - 1 + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

export function formatLabelBulan(year: number, month: number) {
  return new Date(year, month - 1, 1).toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  });
}

function getSetoranDateKey(item: SetoranRingkasan): string | null {
  const raw = item.tanggal_setoran || item.created_at;
  if (!raw) return null;
  // tanggal_setoran biasanya YYYY-MM-DD; created_at ISO
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function inYearMonth(item: SetoranRingkasan, year: number, month: number) {
  const key = getSetoranDateKey(item);
  if (!key) return false;
  return key.startsWith(`${year}-${pad2(month)}`);
}

export function computeRingkasanBulanan(
  allRecords: SetoranRingkasan[],
  year: number,
  month: number
): RingkasanBulananResult {
  const rows = allRecords
    .filter((r) => inYearMonth(r, year, month))
    .sort((a, b) => {
      const da = getSetoranDateKey(a) || '';
      const db = getSetoranDateKey(b) || '';
      return db.localeCompare(da);
    });

  const progressMonth = computeJuzProgress(rows);
  const overall = computeJuzProgress(allRecords);
  const overallLevel = getSantriLevel(overall.juzSelesaiCount);

  const daySet = new Set<string>();
  for (const r of rows) {
    const k = getSetoranDateKey(r);
    if (k) daySet.add(k);
  }

  const catatanUstadz = rows
    .filter((r) => (r.catatan || '').trim())
    .slice(0, 5)
    .map((r) => ({
      tanggal: getSetoranDateKey(r) || r.created_at,
      teks: (r.catatan || '').trim(),
      jenis: r.jenis_setoran,
    }));

  return {
    year,
    month,
    labelBulan: formatLabelBulan(year, month),
    totalSetoran: progressMonth.totalSetoran,
    totalZiyadah: progressMonth.totalZiyadah,
    totalMurajaah: progressMonth.totalMurajaah,
    juzSelesaiBulanIni: progressMonth.juzSelesaiList,
    juzSelesaiCount: progressMonth.juzSelesaiCount,
    hariAktif: daySet.size,
    catatanUstadz,
    setoranTerakhir: rows[0] || null,
    rows,
    overallJuzSelesai: overall.juzSelesaiCount,
    overallLevel: overallLevel.label,
  };
}
