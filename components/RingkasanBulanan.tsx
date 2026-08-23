'use client';

import React, { useMemo, useState } from 'react';
import {
  computeRingkasanBulanan,
  getCurrentYearMonth,
  shiftYearMonth,
  toYearMonthKey,
  type SetoranRingkasan,
} from '@/src/utils/ringkasanBulanan';
import { ChevronLeft, ChevronRight, Printer } from 'lucide-react';
import { brand } from '@/src/config/brand';

type RingkasanBulananProps = {
  santriNama: string;
  kodeUnik: string;
  tingkatanLabel?: string;
  records: SetoranRingkasan[];
  /** dark = halaman ustadz, light = portal wali */
  variant?: 'light' | 'dark';
};

export default function RingkasanBulananCard({
  santriNama,
  kodeUnik,
  tingkatanLabel,
  records,
  variant = 'light',
}: RingkasanBulananProps) {
  const current = getCurrentYearMonth();
  const [year, setYear] = useState(current.year);
  const [month, setMonth] = useState(current.month);

  const ringkasan = useMemo(
    () => computeRingkasanBulanan(records, year, month),
    [records, year, month]
  );

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
    // jangan melewati bulan berjalan
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
  const card =
    isDark
      ? 'rounded-xl border border-slate-800 bg-slate-950 p-3 text-center'
      : 'rounded-xl border border-slate-200 bg-slate-50 p-3 text-center dark:border-slate-800 dark:bg-slate-950/50';

  return (
    <section
      className={`${shell} ringkasan-bulanan-print print:bg-white print:text-black print:border-slate-300 print:shadow-none`}
      data-month={toYearMonthKey(year, month)}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div>
          <h2 className={title}>Ringkasan Bulanan</h2>
          <p className={`${muted} mt-0.5`}>
            Progres {santriNama} · {ringkasan.labelBulan}
            {tingkatanLabel ? ` · ${tingkatanLabel}` : ''}
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
            {ringkasan.labelBulan}
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
          <button
            type="button"
            onClick={() => window.print()}
            className="ml-1 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
          >
            <Printer className="w-3.5 h-3.5" />
            Cetak
          </button>
        </div>
      </div>

      {/* Header cetak */}
      <div className="hidden print:block mb-4 border-b border-slate-300 pb-3">
        <p className="text-xs text-slate-500 uppercase tracking-wider">{brand.name} · Ringkasan Bulanan</p>
        <h3 className="text-xl font-bold text-slate-900 mt-1">{santriNama}</h3>
        <p className="text-sm text-slate-600">
          PIN {kodeUnik}
          {tingkatanLabel ? ` · ${tingkatanLabel}` : ''} · {ringkasan.labelBulan}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={card}>
          <p className={muted}>Total Setoran</p>
          <p className={`text-2xl font-black mt-1 ${isDark ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
            {ringkasan.totalSetoran}
          </p>
        </div>
        <div className={card}>
          <p className={`${muted} ${isDark ? '' : 'text-emerald-700 dark:text-emerald-400'}`}>Ziyadah</p>
          <p className={`text-2xl font-black mt-1 ${isDark ? 'text-emerald-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
            {ringkasan.totalZiyadah}
          </p>
        </div>
        <div className={card}>
          <p className={`${muted} ${isDark ? '' : 'text-amber-700 dark:text-amber-400'}`}>Murajaah</p>
          <p className={`text-2xl font-black mt-1 ${isDark ? 'text-amber-400' : 'text-amber-700 dark:text-amber-400'}`}>
            {ringkasan.totalMurajaah}
          </p>
        </div>
        <div className={card}>
          <p className={muted}>Hari aktif</p>
          <p className={`text-2xl font-black mt-1 ${isDark ? 'text-sky-300' : 'text-sky-700 dark:text-sky-300'}`}>
            {ringkasan.hariAktif}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div
          className={
            isDark
              ? 'rounded-xl border border-slate-800 bg-slate-950 p-4'
              : 'rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40'
          }
        >
          <p className={muted}>Juz ditandai selesai bulan ini</p>
          <p className={`text-lg font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
            {ringkasan.juzSelesaiCount > 0
              ? `${ringkasan.juzSelesaiCount} juz (${ringkasan.juzSelesaiBulanIni.join(', ')})`
              : 'Belum ada'}
          </p>
          <p className={`${muted} mt-2`}>
            Akumulasi saat ini: {ringkasan.overallJuzSelesai}/30 · Level {ringkasan.overallLevel}
          </p>
        </div>

        <div
          className={
            isDark
              ? 'rounded-xl border border-slate-800 bg-slate-950 p-4'
              : 'rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40'
          }
        >
          <p className={muted}>Setoran terakhir bulan ini</p>
          {ringkasan.setoranTerakhir ? (
            <>
              <p className={`font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                {ringkasan.setoranTerakhir.nama_surah || 'Setoran'} · Juz{' '}
                {ringkasan.setoranTerakhir.juz ?? '-'}
              </p>
              <p className={`${muted} mt-1 capitalize`}>
                {ringkasan.setoranTerakhir.jenis_setoran} · Kelancaran:{' '}
                {ringkasan.setoranTerakhir.nilai_kelancaran || '-'} · Tajwid:{' '}
                {ringkasan.setoranTerakhir.nilai_tajwid || '-'}
              </p>
            </>
          ) : (
            <p className={`font-medium mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Belum ada setoran pada bulan ini.
            </p>
          )}
        </div>
      </div>

      {ringkasan.catatanUstadz.length > 0 && (
        <div className="mt-4">
          <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Catatan ustadz
          </p>
          <ul className="space-y-2">
            {ringkasan.catatanUstadz.map((c, idx) => (
              <li
                key={`${c.tanggal}-${idx}`}
                className={
                  isDark
                    ? 'text-xs text-slate-300 border border-slate-800 rounded-lg px-3 py-2 bg-slate-950'
                    : 'text-xs text-slate-600 border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300'
                }
              >
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 capitalize">
                  {c.jenis}
                </span>
                <span className="text-slate-400"> · {c.tanggal} — </span>
                {c.teks}
              </li>
            ))}
          </ul>
        </div>
      )}

      {ringkasan.rows.length > 0 && (
        <div className="mt-4 overflow-x-auto print:overflow-visible">
          <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Rincian setoran bulan ini ({ringkasan.rows.length})
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
                <th className="py-2 pr-2 font-semibold">Jenis</th>
                <th className="py-2 pr-2 font-semibold">Juz</th>
                <th className="py-2 pr-2 font-semibold">Surah</th>
                <th className="py-2 font-semibold">Nilai</th>
              </tr>
            </thead>
            <tbody>
              {ringkasan.rows.map((r) => (
                <tr
                  key={r.id}
                  className={
                    isDark
                      ? 'border-b border-slate-800/70 text-slate-300'
                      : 'border-b border-slate-100 text-slate-700 dark:border-slate-800 dark:text-slate-300'
                  }
                >
                  <td className="py-1.5 pr-2 whitespace-nowrap">
                    {(r.tanggal_setoran || r.created_at || '').slice(0, 10)}
                  </td>
                  <td className="py-1.5 pr-2 capitalize">{r.jenis_setoran}</td>
                  <td className="py-1.5 pr-2 font-mono">
                    {r.juz ?? '-'}
                    {r.juz_selesai ? ' ✓' : ''}
                  </td>
                  <td className="py-1.5 pr-2">
                    {r.nama_surah || '-'}
                    {r.ayat_mulai != null ? ` ${r.ayat_mulai}-${r.ayat_selesai ?? ''}` : ''}
                  </td>
                  <td className="py-1.5">
                    {(r.nilai_kelancaran || '-') + ' / ' + (r.nilai_tajwid || '-')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
