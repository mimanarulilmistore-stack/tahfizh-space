'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { BellRing, ChevronRight, ShieldCheck } from 'lucide-react';

export type InfoAdminItem = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  count: number;
  unit: string;
  tone: 'danger' | 'warning' | 'info' | 'success';
  actionLabel?: string;
  onAction?: () => void;
};

type PusatInfoAdminCardProps = {
  items: InfoAdminItem[];
};

function getToneClass(tone: InfoAdminItem['tone']) {
  if (tone === 'danger') {
    return {
      shell: 'from-slate-900 via-slate-900 to-rose-950/30 border-slate-800',
      accent: 'text-rose-300',
      count: 'text-rose-300',
      dot: 'bg-rose-400',
      badge: 'bg-rose-950/60 text-rose-300 border-rose-800/80',
      button: 'text-rose-300 hover:text-white hover:bg-rose-900/40',
    };
  }
  if (tone === 'warning') {
    return {
      shell: 'from-slate-900 via-slate-900 to-amber-950/30 border-slate-800',
      accent: 'text-amber-300',
      count: 'text-amber-300',
      dot: 'bg-amber-400',
      badge: 'bg-amber-950/60 text-amber-300 border-amber-800/80',
      button: 'text-amber-300 hover:text-white hover:bg-amber-900/30',
    };
  }
  if (tone === 'info') {
    return {
      shell: 'from-slate-900 via-slate-900 to-sky-950/30 border-slate-800',
      accent: 'text-sky-300',
      count: 'text-sky-300',
      dot: 'bg-sky-400',
      badge: 'bg-sky-950/60 text-sky-300 border-sky-800/80',
      button: 'text-sky-300 hover:text-white hover:bg-sky-900/30',
    };
  }
  return {
    shell: 'from-slate-900 via-slate-900 to-emerald-950/30 border-slate-800',
    accent: 'text-emerald-300',
    count: 'text-emerald-300',
    dot: 'bg-emerald-400',
    badge: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80',
    button: 'text-emerald-300 hover:text-white hover:bg-emerald-900/30',
  };
}

export default function PusatInfoAdminCard({ items }: PusatInfoAdminCardProps) {
  const normalizedItems = useMemo(
    () =>
      items.length > 0
        ? items
        : [
            {
              id: 'empty',
              eyebrow: 'Pusat Info Admin',
              title: 'Belum ada info',
              description: 'Tidak ada notifikasi operasional saat ini.',
              count: 0,
              unit: 'info',
              tone: 'success' as const,
            },
          ],
    [items]
  );
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex((current) => Math.min(current, normalizedItems.length - 1));
  }, [normalizedItems.length]);

  useEffect(() => {
    if (normalizedItems.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % normalizedItems.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [normalizedItems.length]);

  const active = normalizedItems[activeIndex];
  const tone = getToneClass(active.tone);
  const activeAlerts = normalizedItems.filter((item) => item.count > 0).length;

  return (
    <div
      className={`sm:col-span-2 bg-gradient-to-r ${tone.shell} border rounded-2xl p-6 relative overflow-hidden`}
    >
      <div className="absolute right-4 top-4 flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${tone.badge}`}
        >
          <BellRing className="w-3 h-3" />
          {activeAlerts} info aktif
        </span>
      </div>

      <div className="flex items-start justify-between gap-4 pr-24">
        <div className="space-y-2 min-w-0">
          <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${tone.accent}`}>
            <ShieldCheck className="w-4 h-4" />
            {active.eyebrow}
          </div>
          <h3 className="text-base font-bold text-white">{active.title}</h3>
          <p className="text-xs text-slate-400 max-w-xl">{active.description}</p>

          <div className="flex items-center gap-2 pt-2">
            {normalizedItems.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                aria-label={`Buka info ${idx + 1}`}
                onClick={() => setActiveIndex(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === activeIndex ? `w-6 ${tone.dot}` : 'w-2 bg-slate-700 hover:bg-slate-600'
                }`}
              />
            ))}
          </div>

          {active.actionLabel && active.onAction ? (
            <button
              type="button"
              onClick={active.onAction}
              className={`mt-1 inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-all ${tone.button}`}
            >
              {active.actionLabel}
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : null}
        </div>

        <div className="text-right shrink-0">
          <p className={`text-3xl font-extrabold ${tone.count}`}>{active.count}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">{active.unit}</p>
        </div>
      </div>
    </div>
  );
}
