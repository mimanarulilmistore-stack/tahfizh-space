'use client';

import React, { useState } from 'react';

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
  /** Izinkan klik untuk menandai/membatalkan juz selesai */
  interactive?: boolean;
  /** Juz yang sedang disimpan */
  busyJuz?: number | null;
  disabled?: boolean;
  /**
   * currentlyCompleted = true jika juz sudah selesai sebelum diklik.
   * hasExistingZiyadah = ada setoran ziyadah untuk juz itu.
   */
  onToggleJuz?: (
    juz: number,
    currentlyCompleted: boolean,
    hasExistingZiyadah: boolean
  ) => void | Promise<void>;
};

const ALL_JUZ = Array.from({ length: 30 }, (_, i) => i + 1);

function cellClasses(
  status: 'selesai' | 'proses' | 'belum',
  isTarget: boolean,
  variant: JuzMapVariant,
  interactive: boolean,
  isBusy: boolean,
  isPending: boolean
): string {
  const base =
    'relative aspect-square min-h-[2rem] rounded-lg text-[11px] sm:text-xs font-bold flex items-center justify-center transition-transform select-none touch-manipulation';
  const clickable = interactive
    ? `cursor-pointer hover:brightness-110 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
        isBusy || isPending ? 'opacity-60' : ''
      }`
    : '';

  if (variant === 'dark') {
    if (status === 'selesai') {
      return `${base} ${clickable} bg-emerald-500 text-emerald-950 shadow-sm shadow-emerald-900/40 ${
        isPending ? 'ring-2 ring-white' : ''
      }`;
    }
    if (status === 'proses') {
      return `${base} ${clickable} bg-amber-500/25 text-amber-200 border border-amber-500/50 ${
        isPending ? 'ring-2 ring-amber-300' : ''
      }`;
    }
    return `${base} ${clickable} bg-slate-950 text-slate-500 border border-slate-800 ${
      isTarget ? 'ring-2 ring-sky-500/70 ring-offset-1 ring-offset-slate-900' : ''
    } ${isPending ? 'ring-2 ring-emerald-400' : ''}`;
  }

  if (status === 'selesai') {
    return `${base} ${clickable} bg-emerald-600 text-white shadow-sm dark:bg-emerald-500 dark:text-emerald-950 ${
      isPending ? 'ring-2 ring-emerald-900' : ''
    }`;
  }
  if (status === 'proses') {
    return `${base} ${clickable} bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-500/25 dark:text-amber-200 dark:border-amber-500/50 ${
      isPending ? 'ring-2 ring-amber-500' : ''
    }`;
  }
  return `${base} ${clickable} bg-slate-100 text-slate-400 border border-slate-200 dark:bg-slate-950 dark:text-slate-500 dark:border-slate-800 ${
    isTarget
      ? 'ring-2 ring-sky-400 ring-offset-1 ring-offset-white dark:ring-sky-500/70 dark:ring-offset-slate-900'
      : ''
  } ${isPending ? 'ring-2 ring-emerald-500' : ''}`;
}

export default function JuzMap({
  completedJuz = [],
  startedJuz = [],
  targetJuz = 30,
  variant = 'light',
  className = '',
  compact = false,
  interactive = false,
  busyJuz = null,
  disabled = false,
  onToggleJuz,
}: JuzMapProps) {
  const [pendingJuz, setPendingJuz] = useState<number | null>(null);

  const completed = new Set(
    completedJuz.filter((j) => Number.isFinite(j) && j >= 1 && j <= 30).map((j) => Math.floor(j))
  );
  const started = new Set(
    startedJuz.filter((j) => Number.isFinite(j) && j >= 1 && j <= 30).map((j) => Math.floor(j))
  );
  const target = Math.min(30, Math.max(1, Number(targetJuz) || 30));
  const selesaiCount = completed.size;
  const prosesCount = [...started].filter((j) => !completed.has(j)).length;
  // disabled hanya menonaktifkan aksi, tetap render sebagai tombol agar klik tidak "mati"
  const showAsInteractive = Boolean(interactive && onToggleJuz);
  const actionsLocked = disabled || busyJuz != null;

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

  const pendingCompleted = pendingJuz != null ? completed.has(pendingJuz) : false;
  const pendingHasZiyadah =
    pendingJuz != null ? completed.has(pendingJuz) || started.has(pendingJuz) : false;

  const handleCellClick = (juz: number) => {
    if (!showAsInteractive || actionsLocked) return;
    setPendingJuz(juz);
  };

  const handleConfirm = async () => {
    if (pendingJuz == null || !onToggleJuz || actionsLocked) return;
    const juz = pendingJuz;
    const currentlyCompleted = completed.has(juz);
    const hasExistingZiyadah = currentlyCompleted || started.has(juz);
    setPendingJuz(null);
    await onToggleJuz(juz, currentlyCompleted, hasExistingZiyadah);
  };

  const confirmPanelCls =
    variant === 'dark'
      ? 'mt-4 rounded-xl border border-emerald-800/70 bg-emerald-950/40 p-3 sm:p-4'
      : 'mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 sm:p-4';

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
            {showAsInteractive && (
              <p className={`${subCls} mt-1 font-medium text-emerald-400`}>
                Klik nomor juz untuk menandai atau membatalkan selesai.
              </p>
            )}
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
        role={showAsInteractive ? 'group' : 'list'}
        aria-label="Peta progres juz 1 sampai 30"
      >
        {ALL_JUZ.map((juz) => {
          const status: 'selesai' | 'proses' | 'belum' = completed.has(juz)
            ? 'selesai'
            : started.has(juz)
              ? 'proses'
              : 'belum';
          const isTarget = juz === target;
          const isBusy = busyJuz === juz;
          const isPending = pendingJuz === juz;
          const label =
            status === 'selesai'
              ? `Juz ${juz} selesai`
              : status === 'proses'
                ? `Juz ${juz} sedang diproses`
                : `Juz ${juz} belum`;
          const interactiveLabel =
            status === 'selesai'
              ? `Batalkan tanda Juz ${juz} selesai`
              : `Tandai Juz ${juz} selesai`;
          const classNameCell = cellClasses(
            status,
            isTarget,
            variant,
            showAsInteractive,
            isBusy,
            isPending
          );

          if (showAsInteractive) {
            return (
              <button
                key={juz}
                type="button"
                title={interactiveLabel}
                aria-label={interactiveLabel}
                aria-pressed={status === 'selesai'}
                disabled={actionsLocked}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCellClick(juz);
                }}
                className={classNameCell}
              >
                {isBusy ? '…' : juz}
                {status === 'selesai' && !isBusy && (
                  <span className="absolute bottom-0.5 right-0.5 text-[8px] leading-none opacity-80">
                    ✓
                  </span>
                )}
              </button>
            );
          }

          return (
            <div
              key={juz}
              role="listitem"
              title={isTarget ? `${label} (target)` : label}
              aria-label={isTarget ? `${label}, target hafalan` : label}
              className={classNameCell}
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

      {showAsInteractive && pendingJuz != null && (
        <div className={confirmPanelCls} role="dialog" aria-label="Konfirmasi tanda juz">
          <p
            className={`text-sm font-semibold ${
              variant === 'dark' ? 'text-emerald-100' : 'text-emerald-900'
            }`}
          >
            {pendingCompleted
              ? `Batalkan tanda Juz ${pendingJuz} selesai?`
              : pendingHasZiyadah
                ? `Tandai Juz ${pendingJuz} sebagai selesai?`
                : `Belum ada ziyadah Juz ${pendingJuz}. Buat catatan penyelesaian?`}
          </p>
          <p
            className={`text-xs mt-1 ${
              variant === 'dark' ? 'text-emerald-300/80' : 'text-emerald-800/80'
            }`}
          >
            Level dan lencana akan menyesuaikan setelah dikonfirmasi.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={actionsLocked}
              className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold"
            >
              Ya, lanjutkan
            </button>
            <button
              type="button"
              onClick={() => setPendingJuz(null)}
              disabled={actionsLocked}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold border ${
                variant === 'dark'
                  ? 'border-slate-700 text-slate-200 hover:bg-slate-800'
                  : 'border-slate-300 text-slate-700 hover:bg-white'
              }`}
            >
              Batal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
