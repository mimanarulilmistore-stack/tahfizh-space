'use client';

import React, { useMemo, useState } from 'react';
import {
  STATUS_ABSENSI_OPTIONS,
  filterAbsensiByYearMonth,
  getStatusAbsensiLabel,
  rekapAbsensiDariRecords,
  type AbsensiRecord,
} from '@/src/utils/absensi';
import {
  formatLabelBulan,
  getCurrentYearMonth,
  shiftYearMonth,
  toYearMonthKey,
} from '@/src/utils/ringkasanBulanan';
import { ChevronLeft, ChevronRight, ClipboardCheck } from 'lucide-react';

type AbsensiWaliRow = {
  tanggal: string;
  status: string;
  catatan?: string | null;
};

type RekapAbsensiWaliCardProps = {
  santriNama: string;
  records: AbsensiWaliRow[];
  /** dark = halaman ustadz, light = portal wali */
  variant?: 'light' | 'dark';
};

export default function RekapAbsensiWaliCard({
  santriNama,
  records,
  variant = 'light',
}: RekapAbsensiWaliCardProps) {
  const current = getCurrentYearMonth();
  const [year, setYear] = useState(current.year);
  const [month, setMonth] = useState(current.month);

  const monthRecords = useMemo(
    () => filterAbsensiByYearMonth(records, year, month),
    [records, year, month]
  );

  const rekap = useMemo(() => {
    const asRecords: AbsensiRecord[] = monthRecords.map((r) => ({
      santri_id: '',
      tanggal: r.tanggal,
      status: r.status,
      catatan: r.catatan,
    }));
    return rekapAbsensiDariRecords(asRecords);
  }, [monthRecords]);

  const labelBulan = formatLabelBulan(year, month);
  const isCurrentMonth = year === current.year && month === current.month;
  const isDark = variant === 'dark';

  const goPrev = () => {
    const next = shiftYearMonth(year, month, -1);
    setYear(next.year);
    setMonth(next.month);
  };

  const goNext = () => {
    if (isCurrentMonth) return;
    const next = shiftYearMonth(year, month, 1);
    if (
      next.year > current.year ||
      (next.year === current.year && next.month > current.month)
    ) {
      return;
    }
    setYear(next.year);
    setMonth(next.month);
  };

  const shell = isDark
    ? 'rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6'
    : 'rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900';
  const title = isDark
    ? 'text-lg font-bold text-white'
    : 'text-lg font-bold text-slate-800 dark:text-slate-100';
  const muted = isDark
    ? 'text-xs text-slate-400'
    : 'text-xs text-slate-500 dark:text-slate-400';
  const card = isDark
    ? 'rounded-xl border border-slate-800 bg-slate-950 p-3 text-center'
    : 'rounded-xl border border-slate-200 bg-slate-50 p-3 text-center dark:border-slate-800 dark:bg-slate-950/50';

  return (
    <section className={shell} data-month={toYearMonthKey(year, month)}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div>
          <h2 className={`${title} flex items-center gap-2`}>
            <ClipboardCheck
              className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}
            />
            Rekap Absensi
          </h2>
          <p className={`${muted} mt-0.5`}>
            Kehadiran {santriNama} · {labelBulan}
          </p>
        </div>

        <div className="flex items-center gap-2 print:hidden">
          <button
            type="button"
            onClick={goPrev}
            className={`p-2 rounded-lg border ${
              isDark
                ? 'border-slate-700 hover:bg-slate-800 text-slate-200'
                : 'border-slate-200 hover:bg-slate-50 text-slate-700 dark:border-slate-700 dark:hover:bg-slate-800 dark:text-slate-200'
            }`}
            aria-label="Bulan sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span
            className={`text-xs font-bold min-w-[8.5rem] text-center ${
              isDark ? 'text-emerald-300' : 'text-emerald-700 dark:text-emerald-300'
            }`}
          >
            {labelBulan}
          </span>
          <button
            type="button"
            onClick={goNext}
            disabled={isCurrentMonth}
            className={`p-2 rounded-lg border disabled:opacity-40 ${
              isDark
                ? 'border-slate-700 hover:bg-slate-800 text-slate-200'
                : 'border-slate-200 hover:bg-slate-50 text-slate-700 dark:border-slate-700 dark:hover:bg-slate-800 dark:text-slate-200'
            }`}
            aria-label="Bulan berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {STATUS_ABSENSI_OPTIONS.map((s) => (
          <div key={s.value} className={card}>
            <p className={muted}>{s.label}</p>
            <p
              className={`text-2xl font-black mt-1 ${
                isDark ? 'text-white' : 'text-slate-900 dark:text-white'
              }`}
            >
              {rekap[s.value]}
            </p>
          </div>
        ))}
        <div className={card}>
          <p className={`${muted} ${isDark ? '' : 'text-emerald-700 dark:text-emerald-400'}`}>
            % Hadir
          </p>
          <p
            className={`text-2xl font-black mt-1 ${
              isDark ? 'text-emerald-400' : 'text-emerald-700 dark:text-emerald-400'
            }`}
          >
            {rekap.terisi > 0 ? `${rekap.persenHadir}%` : '-'}
          </p>
        </div>
      </div>

      {monthRecords.length === 0 ? (
        <p className={`mt-4 text-sm italic ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Belum ada catatan absensi pada bulan ini.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <p
            className={`text-xs font-bold uppercase tracking-wider mb-2 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            Rincian absensi ({monthRecords.length} hari)
          </p>
          <table className="w-full text-left text-[11px] border-collapse">
            <thead>
              <tr
                className={
                  isDark
                    ? 'border-y border-slate-800 text-slate-400'
                    : 'border-y border-slate-200 text-slate-500 dark:border-slate-800'
                }
              >
                <th className="py-2 pr-2 font-semibold">Tanggal</th>
                <th className="py-2 pr-2 font-semibold">Status</th>
                <th className="py-2 font-semibold">Catatan</th>
              </tr>
            </thead>
            <tbody>
              {monthRecords.map((r) => (
                <tr
                  key={`${r.tanggal}-${r.status}`}
                  className={
                    isDark
                      ? 'border-b border-slate-800/70 text-slate-300'
                      : 'border-b border-slate-100 text-slate-700 dark:border-slate-800 dark:text-slate-300'
                  }
                >
                  <td className="py-1.5 pr-2 whitespace-nowrap">{r.tanggal}</td>
                  <td className="py-1.5 pr-2 font-semibold">
                    {getStatusAbsensiLabel(r.status)}
                  </td>
                  <td className="py-1.5 italic">{r.catatan || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
