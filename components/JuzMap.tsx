'use client';

import React from 'react';

export type JuzMapVariant = 'light' | 'dark';

type JuzMapProps = {
  /** Nomor juz yang sudah ditandai selesai */
  completedJuz?: number[];
  /** Juz yang sudah ada ziyadah tapi belum selesai */
  startedJuz?: number[];
  /** Target hafalan (1–30), ditandai ring */
  targetJuz?: number;
  variant?: JuzMapVariant;
  className?: string;
  /** Sembunyikan judul & legenda ringkas */
  compact?: boolean;
};

const ALL_JUZ = Array.from({ length: 30 }, (_, i) => i + 1);

function cellClasses(
  status: 'selesai' | 'proses' | 'belum',
  isTarget: boolean,
  variant: JuzMapVariant
): string {
  const base =
    'relative aspect-square rounded-lg text-[11px] sm:text-xs font-bold flex items-center justify-center transition-colors select-none';

  if (variant === 'dark') {
    if (status === 'selesai') {
      return `${base} bg-emerald-500 text-emerald-950 shadow-sm shadow-emerald-900/40`;
    }
    if (status === 'proses') {
      return `${base} bg-amber-500/25 text-amber-200 border border-amber-500/50`;
    }
    return `${base} bg-slate-950 text-slate-500 border border-slate-800 ${
      isTarget ? 'ring-2 ring-sky-500/70 ring-offset-1 ring-offset-slate-900' : ''
    }`;
  }

  if (status === 'selesai') {
    return `${base} bg-emerald-600 text-white shadow-sm dark:bg-emerald-500 dark:text-emerald-950`;
  }
  if (status === 'proses') {
    return `${base} bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-500/25 dark:text-amber-200 dark:border-amber-500/50`;
  }
  return `${base} bg-slate-100 text-slate-400 border border-slate-200 dark:bg-slate-950 dark:text-slate-500 dark:border-slate-800 ${
    isTarget
      ? 'ring-2 ring-sky-400 ring-offset-1 ring-offset-white dark:ring-sky-500/70 dark:ring-offset-slate-900'
      : ''
  }`;
}

export default function JuzMap({
  completedJuz = [],
  startedJuz = [],
  targetJuz = 30,
  variant = 'light',
  className = '',
  compact = false,
}: JuzMapProps) {
  const completed = new Set(
    completedJuz.filter((j) => Number.isFinite(j) && j >= 1 && j <= 30).map((j) => Math.floor(j))
  );
  const started = new Set(
    startedJuz.filter((j) => Number.isFinite(j) && j >= 1 && j <= 30).map((j) => Math.floor(j))
  );
  const target = Math.min(30, Math.max(1, Number(targetJuz) || 30));
  const selesaiCount = completed.size;
  const prosesCount = [...started].filter((j) => !completed.has(j)).length;

  const shell =
    variant === 'dark'
      ? 'rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-5'
      : 'rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900';

  const titleCls =
    variant === 'dark'
      ? 'text-sm font-bold text-white'
      : 'text-sm font-bold text-slate-800 dark:text-slate-100';
  const subCls =
    variant === 'dark' ? 'text-xs text-slate-400' : 'text-xs text-slate-500 dark:text-slate-400';
  const legendCls =
    variant === 'dark'
      ? 'text-[10px] text-slate-400'
      : 'text-[10px] text-slate-500 dark:text-slate-400';

  return (
    <div className={`${shell} ${className}`}>
      {!compact && (
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h3 className={titleCls}>Peta Juz 1–30</h3>
            <p className={`${subCls} mt-0.5`}>
              {selesaiCount}/30 selesai
              {prosesCount > 0 ? ` · ${prosesCount} sedang diproses` : ''}
              {target < 30 ? ` · target ${target}` : ''}
            </p>
          </div>
          <div className={`flex flex-wrap items-center gap-3 ${legendCls}`}>
            <span className="inline-flex items-center gap-1.5">
              <span
                className={`h-2.5 w-2.5 rounded-sm ${
                  variant === 'dark' ? 'bg-emerald-500' : 'bg-emerald-600 dark:bg-emerald-500'
                }`}
              />
              Selesai
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className={`h-2.5 w-2.5 rounded-sm border ${
                  variant === 'dark'
                    ? 'bg-amber-500/30 border-amber-500/60'
                    : 'bg-amber-100 border-amber-300 dark:bg-amber-500/30 dark:border-amber-500/60'
                }`}
              />
              Proses
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className={`h-2.5 w-2.5 rounded-sm border ${
                  variant === 'dark'
                    ? 'bg-slate-950 border-slate-700'
                    : 'bg-slate-100 border-slate-300 dark:bg-slate-950 dark:border-slate-700'
                }`}
              />
              Belum
            </span>
            {target < 30 && (
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm ring-2 ring-sky-400" />
                Target
              </span>
            )}
          </div>
        </div>
      )}

      <div
        className="grid grid-cols-6 sm:grid-cols-10 gap-1.5 sm:gap-2"
        role="list"
        aria-label="Peta progres juz 1 sampai 30"
      >
        {ALL_JUZ.map((juz) => {
          const status: 'selesai' | 'proses' | 'belum' = completed.has(juz)
            ? 'selesai'
            : started.has(juz)
              ? 'proses'
              : 'belum';
          const isTarget = juz === target;
          const label =
            status === 'selesai'
              ? `Juz ${juz} selesai`
              : status === 'proses'
                ? `Juz ${juz} sedang diproses`
                : `Juz ${juz} belum`;

          return (
            <div
              key={juz}
              role="listitem"
              title={isTarget ? `${label} (target)` : label}
              aria-label={isTarget ? `${label}, target hafalan` : label}
              className={cellClasses(status, isTarget, variant)}
            >
              {juz}
              {status === 'selesai' && (
                <span className="absolute bottom-0.5 right-0.5 text-[8px] leading-none opacity-80">
                  ✓
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
