'use client';

import React, { useMemo } from 'react';
import {
  computeTargetMingguan,
  type SetoranMingguan,
} from '@/src/utils/targetMingguan';
import { CheckCircle2, Target } from 'lucide-react';

type TargetMingguanCardProps = {
  records: SetoranMingguan[];
  targetZiyadah: number;
  targetMurajaah: number;
  variant?: 'light' | 'dark';
  className?: string;
};

function ProgressRow({
  label,
  actual,
  target,
  pct,
  done,
  isDark,
}: {
  label: string;
  actual: number;
  target: number;
  pct: number;
  done: boolean;
  isDark: boolean;
}) {
  if (target <= 0) return null;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className={isDark ? 'text-slate-300 font-medium' : 'text-slate-600 dark:text-slate-300 font-medium'}>
          {label}
        </span>
        <span
          className={
            done
              ? 'text-emerald-500 font-bold'
              : isDark
                ? 'text-slate-400 font-mono'
                : 'text-slate-500 dark:text-slate-400 font-mono'
          }
        >
          {actual} / {target}
          {done ? ' ✓' : ''}
        </span>
      </div>
      <div
        className={`h-2.5 rounded-full overflow-hidden ${
          isDark ? 'bg-slate-800' : 'bg-slate-100 dark:bg-slate-800'
        }`}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            done ? 'bg-emerald-500' : 'bg-sky-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function TargetMingguanCard({
  records,
  targetZiyadah,
  targetMurajaah,
  variant = 'light',
  className = '',
}: TargetMingguanCardProps) {
  const progress = useMemo(
    () =>
      computeTargetMingguan(records, {
        targetZiyadah,
        targetMurajaah,
      }),
    [records, targetZiyadah, targetMurajaah]
  );

  const isDark = variant === 'dark';

  if (!progress.hasTarget) {
    return (
      <section
        className={`rounded-2xl border p-5 sm:p-6 ${
          isDark
            ? 'border-slate-800 bg-slate-900'
            : 'border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900'
        } ${className}`}
      >
        <h2
          className={`text-lg font-bold flex items-center gap-2 ${
            isDark ? 'text-white' : 'text-slate-800 dark:text-slate-100'
          }`}
        >
          <Target className="w-5 h-5 text-sky-400" />
          Target Mingguan
        </h2>
        <p
          className={`text-xs mt-2 ${
            isDark ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          Belum diatur. Ustadz dapat mengisi target ziyadah/murajaah di profil santri.
        </p>
      </section>
    );
  }

  return (
    <section
      className={`rounded-2xl border p-5 sm:p-6 space-y-4 ${
        isDark
          ? 'border-slate-800 bg-slate-900'
          : 'border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900'
      } ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
        <div>
          <h2
            className={`text-lg font-bold flex items-center gap-2 ${
              isDark ? 'text-white' : 'text-slate-800 dark:text-slate-100'
            }`}
          >
            <Target className="w-5 h-5 text-sky-400" />
            Target Mingguan
          </h2>
          <p
            className={`text-xs mt-0.5 ${
              isDark ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            Senin–Minggu · {progress.labelRentang}
          </p>
        </div>
        {progress.tercapaiSemua ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Target tercapai
          </span>
        ) : (
          <span
            className={`text-xs font-mono ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            Total {progress.pctOverall}%
          </span>
        )}
      </div>

      <ProgressRow
        label="Ziyadah"
        actual={progress.actualZiyadah}
        target={progress.targetZiyadah}
        pct={progress.pctZiyadah}
        done={progress.tercapaiZiyadah}
        isDark={isDark}
      />
      <ProgressRow
        label="Murajaah"
        actual={progress.actualMurajaah}
        target={progress.targetMurajaah}
        pct={progress.pctMurajaah}
        done={progress.tercapaiMurajaah}
        isDark={isDark}
      />
    </section>
  );
}
