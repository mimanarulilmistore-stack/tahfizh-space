/** Tingkatan kelas generik (bisa dipakai setara SMP/SMA tanpa menyebut jenjang). */
export const TINGKATAN_VALUES = ['dasar', 'menengah', 'tinggi'] as const;

export type TingkatanKelas = (typeof TINGKATAN_VALUES)[number];

export const TINGKATAN_OPTIONS: {
  value: TingkatanKelas;
  label: string;
  short: string;
  description: string;
}[] = [
  {
    value: 'dasar',
    label: 'Dasar',
    short: 'Dasar',
    description: 'Tingkatan awal / pemula',
  },
  {
    value: 'menengah',
    label: 'Menengah',
    short: 'Menengah',
    description: 'Tingkatan menengah',
  },
  {
    value: 'tinggi',
    label: 'Tinggi',
    short: 'Tinggi',
    description: 'Tingkatan lanjutan',
  },
];

export function normalizeTingkatan(raw: unknown): TingkatanKelas | null {
  const v = String(raw || '')
    .trim()
    .toLowerCase();
  if (v === 'dasar' || v === 'menengah' || v === 'tinggi') return v;
  return null;
}

export function getTingkatanLabel(raw: unknown): string {
  const t = normalizeTingkatan(raw);
  if (!t) return 'Belum diatur';
  return TINGKATAN_OPTIONS.find((o) => o.value === t)?.label || 'Belum diatur';
}

export function getTingkatanBadgeClass(raw: unknown): string {
  const t = normalizeTingkatan(raw);
  if (t === 'dasar') {
    return 'bg-sky-950 text-sky-300 border-sky-800';
  }
  if (t === 'menengah') {
    return 'bg-violet-950 text-violet-300 border-violet-800';
  }
  if (t === 'tinggi') {
    return 'bg-amber-950 text-amber-300 border-amber-800';
  }
  return 'bg-slate-900 text-slate-400 border-slate-700';
}
