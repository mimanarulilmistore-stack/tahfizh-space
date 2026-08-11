export type SetoranMingguan = {
  jenis_setoran: string;
  tanggal_setoran?: string | null;
  created_at?: string | null;
};

export type TargetMingguanInput = {
  targetZiyadah: number;
  targetMurajaah: number;
};

export type TargetMingguanProgress = {
  weekStart: string; // YYYY-MM-DD (Senin)
  weekEnd: string; // YYYY-MM-DD (Minggu)
  labelRentang: string;
  actualZiyadah: number;
  actualMurajaah: number;
  targetZiyadah: number;
  targetMurajaah: number;
  pctZiyadah: number;
  pctMurajaah: number;
  pctOverall: number;
  tercapaiZiyadah: boolean;
  tercapaiMurajaah: boolean;
  tercapaiSemua: boolean;
  hasTarget: boolean;
};

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function toYmd(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function parseYmdLocal(raw: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw.trim());
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Senin minggu berjalan (lokal). */
export function getWeekRange(ref: Date = new Date()) {
  const d = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), 12, 0, 0);
  const day = d.getDay(); // 0 Minggu … 6 Sabtu
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const start = new Date(d);
  start.setDate(d.getDate() + diffToMonday);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start, end, weekStart: toYmd(start), weekEnd: toYmd(end) };
}

function setoranDateKey(item: SetoranMingguan): string | null {
  if (item.tanggal_setoran) {
    const raw = String(item.tanggal_setoran).slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  }
  if (item.created_at) {
    const d = parseYmdLocal(item.created_at) || new Date(item.created_at);
    if (!Number.isNaN(d.getTime())) return toYmd(d);
  }
  return null;
}

function clampPct(n: number) {
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(100, Math.round(n));
}

export function computeTargetMingguan(
  records: SetoranMingguan[],
  targets: TargetMingguanInput,
  ref: Date = new Date()
): TargetMingguanProgress {
  const { weekStart, weekEnd, start, end } = getWeekRange(ref);
  const targetZiyadah = Math.max(0, Number(targets.targetZiyadah) || 0);
  const targetMurajaah = Math.max(0, Number(targets.targetMurajaah) || 0);

  let actualZiyadah = 0;
  let actualMurajaah = 0;

  for (const item of records) {
    const key = setoranDateKey(item);
    if (!key || key < weekStart || key > weekEnd) continue;
    const jenis = (item.jenis_setoran || '').toLowerCase();
    if (jenis === 'ziyadah') actualZiyadah += 1;
    else if (jenis === 'murajaah') actualMurajaah += 1;
  }

  const pctZiyadah =
    targetZiyadah > 0 ? clampPct((actualZiyadah / targetZiyadah) * 100) : 100;
  const pctMurajaah =
    targetMurajaah > 0 ? clampPct((actualMurajaah / targetMurajaah) * 100) : 100;

  const weightedParts: number[] = [];
  if (targetZiyadah > 0) weightedParts.push(Math.min(1, actualZiyadah / targetZiyadah));
  if (targetMurajaah > 0) weightedParts.push(Math.min(1, actualMurajaah / targetMurajaah));
  const pctOverall =
    weightedParts.length === 0
      ? 0
      : clampPct(
          (weightedParts.reduce((a, b) => a + b, 0) / weightedParts.length) * 100
        );

  const tercapaiZiyadah = targetZiyadah === 0 || actualZiyadah >= targetZiyadah;
  const tercapaiMurajaah = targetMurajaah === 0 || actualMurajaah >= targetMurajaah;
  const hasTarget = targetZiyadah > 0 || targetMurajaah > 0;

  const labelRentang = `${start.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
  })} – ${end.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })}`;

  return {
    weekStart,
    weekEnd,
    labelRentang,
    actualZiyadah,
    actualMurajaah,
    targetZiyadah,
    targetMurajaah,
    pctZiyadah,
    pctMurajaah,
    pctOverall,
    tercapaiZiyadah,
    tercapaiMurajaah,
    tercapaiSemua: hasTarget && tercapaiZiyadah && tercapaiMurajaah,
    hasTarget,
  };
}
