/** Status & helper SPP bulanan. */

export const STATUS_SPP_VALUES = ['lunas', 'belum'] as const;

export type StatusSpp = (typeof STATUS_SPP_VALUES)[number];

export const STATUS_SPP_OPTIONS: {
  value: StatusSpp;
  label: string;
  description: string;
}[] = [
  {
    value: 'lunas',
    label: 'Lunas',
    description: 'SPP bulan ini sudah dibayar',
  },
  {
    value: 'belum',
    label: 'Belum',
    description: 'SPP bulan ini belum dibayar',
  },
];

export const DEFAULT_NOMINAL_SPP = 150_000;

export function normalizeStatusSpp(raw: unknown): StatusSpp | null {
  const v = String(raw || '')
    .trim()
    .toLowerCase();
  if (v === 'lunas' || v === 'belum') return v;
  return null;
}

export function getStatusSppLabel(raw: unknown): string {
  const s = normalizeStatusSpp(raw);
  if (!s) return 'Belum';
  return STATUS_SPP_OPTIONS.find((o) => o.value === s)?.label || 'Belum';
}

export function getStatusSppBadgeClass(raw: unknown): string {
  const s = normalizeStatusSpp(raw);
  if (s === 'lunas') {
    return 'bg-emerald-950 text-emerald-300 border-emerald-800';
  }
  return 'bg-rose-950 text-rose-300 border-rose-800';
}

/** Periode bulan berjalan YYYY-MM (UTC date aman untuk input type=month). */
export function currentPeriodeKey(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function formatPeriodeLabel(periode: string) {
  const m = /^(\d{4})-(\d{2})$/.exec(periode);
  if (!m) return periode;
  const year = Number(m[1]);
  const month = Number(m[2]);
  return new Date(year, month - 1, 1).toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  });
}

export function formatRupiah(nilai: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(nilai || 0);
}

export type RekapSpp = {
  totalSantri: number;
  lunas: number;
  belum: number;
  nominalLunas: number;
  nominalBelum: number;
};

/** Hitung rekap dari daftar status efektif (lunas/belum) + nominal per santri. */
export function hitungRekapSpp(
  rows: Array<{ status: StatusSpp; nominal: number }>
): RekapSpp {
  const rekap: RekapSpp = {
    totalSantri: rows.length,
    lunas: 0,
    belum: 0,
    nominalLunas: 0,
    nominalBelum: 0,
  };
  for (const row of rows) {
    if (row.status === 'lunas') {
      rekap.lunas += 1;
      rekap.nominalLunas += row.nominal;
    } else {
      rekap.belum += 1;
      rekap.nominalBelum += row.nominal;
    }
  }
  return rekap;
}
