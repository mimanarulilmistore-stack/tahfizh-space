/** Status kehadiran santri untuk modul absensi. */
export const STATUS_ABSENSI_VALUES = ['hadir', 'sakit', 'izin', 'alpha'] as const;

export type StatusAbsensi = (typeof STATUS_ABSENSI_VALUES)[number];

export const STATUS_ABSENSI_OPTIONS: {
  value: StatusAbsensi;
  label: string;
  short: string;
  description: string;
}[] = [
  {
    value: 'hadir',
    label: 'Hadir',
    short: 'H',
    description: 'Santri hadir mengikuti kegiatan',
  },
  {
    value: 'sakit',
    label: 'Sakit',
    short: 'S',
    description: 'Berhalangan karena sakit',
  },
  {
    value: 'izin',
    label: 'Izin',
    short: 'I',
    description: 'Tidak hadir dengan izin',
  },
  {
    value: 'alpha',
    label: 'Alpha',
    short: 'A',
    description: 'Tidak hadir tanpa keterangan',
  },
];

export function normalizeStatusAbsensi(raw: unknown): StatusAbsensi | null {
  const v = String(raw || '')
    .trim()
    .toLowerCase();
  if (v === 'hadir' || v === 'sakit' || v === 'izin' || v === 'alpha') return v;
  return null;
}

export function getStatusAbsensiLabel(raw: unknown): string {
  const s = normalizeStatusAbsensi(raw);
  if (!s) return 'Belum diisi';
  return STATUS_ABSENSI_OPTIONS.find((o) => o.value === s)?.label || 'Belum diisi';
}

export function getStatusAbsensiBadgeClass(raw: unknown): string {
  const s = normalizeStatusAbsensi(raw);
  if (s === 'hadir') {
    return 'bg-emerald-950 text-emerald-300 border-emerald-800';
  }
  if (s === 'sakit') {
    return 'bg-amber-950 text-amber-300 border-amber-800';
  }
  if (s === 'izin') {
    return 'bg-sky-950 text-sky-300 border-sky-800';
  }
  if (s === 'alpha') {
    return 'bg-rose-950 text-rose-300 border-rose-800';
  }
  return 'bg-slate-900 text-slate-400 border-slate-700';
}

export type RekapAbsensi = Record<StatusAbsensi, number> & { total: number; terisi: number };

export type AbsensiRecord = {
  santri_id: string;
  status: string;
  tanggal: string;
  catatan?: string | null;
};

export type RekapAbsensiDenganPersen = RekapAbsensi & {
  /** Persentase hadir dari hari yang sudah diisi (0–100). */
  persenHadir: number;
};

/** Hitung rekap jumlah tiap status dari daftar status kehadiran. */
export function hitungRekapAbsensi(statuses: Array<StatusAbsensi | null>): RekapAbsensi {
  const rekap: RekapAbsensi = {
    hadir: 0,
    sakit: 0,
    izin: 0,
    alpha: 0,
    total: statuses.length,
    terisi: 0,
  };
  for (const status of statuses) {
    if (!status) continue;
    rekap[status] += 1;
    rekap.terisi += 1;
  }
  return rekap;
}

/** Persentase hadir = Hadir ÷ hari terisi × 100 (dibulatkan 1 desimal). */
export function hitungPersenHadir(hadir: number, terisi: number): number {
  if (terisi <= 0) return 0;
  return Math.round((hadir / terisi) * 1000) / 10;
}

export function tambahPersenHadir(rekap: RekapAbsensi): RekapAbsensiDenganPersen {
  return {
    ...rekap,
    persenHadir: hitungPersenHadir(rekap.hadir, rekap.terisi),
  };
}

/** Rekap absensi satu santri dari baris absensi periode terpilih. */
export function rekapAbsensiDariRecords(
  records: AbsensiRecord[]
): RekapAbsensiDenganPersen {
  const statuses = records.map((r) => normalizeStatusAbsensi(r.status));
  return tambahPersenHadir(hitungRekapAbsensi(statuses));
}
