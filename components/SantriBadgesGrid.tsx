"use client";

import React, { useEffect, useState } from "react";
import { getBrowserSupabase } from "@/src/lib/supabase";
import { calculateSantriBadges, type Badge, type SetoranItem } from "@/src/utils/badgeCalculator";

interface SantriBadgesGridProps {
  santriId: string;
  targetJuz?: number;
  /** Jika diisi (halaman publik), tidak perlu query ulang ke Supabase */
  initialSetoran?: SetoranItem[];
}

export default function SantriBadgesGrid({
  santriId,
  targetJuz = 30,
  initialSetoran,
}: SantriBadgesGridProps) {
  const [badges, setBadges] = useState<Badge[]>(() =>
    initialSetoran ? calculateSantriBadges(initialSetoran) : []
  );
  const [loading, setLoading] = useState(!initialSetoran);

  useEffect(() => {
    if (initialSetoran) {
      setBadges(calculateSantriBadges(initialSetoran));
      setLoading(false);
      return;
    }

    const loadBadges = async () => {
      setLoading(true);
      try {
        const supabase = getBrowserSupabase();
        const { data, error } = await supabase
          .from("setoran_hafalan")
          .select("id, jenis_setoran, juz, juz_selesai, nilai_kelancaran, nilai_tajwid")
          .eq("santri_id", santriId);

        if (error) {
          console.error("Gagal memuat data badge:", error);
          setBadges(calculateSantriBadges([]));
          return;
        }

        const mapped = (data || []).map((item) => ({
          id: item.id,
          jenis_setoran: item.jenis_setoran,
          juz: item.juz,
          juz_selesai: item.juz_selesai,
          nilai_kelancaran: item.nilai_kelancaran,
          nilai_tajwid: item.nilai_tajwid,
        }));

        setBadges(calculateSantriBadges(mapped));
      } catch (err) {
        console.error(err);
        setBadges(calculateSantriBadges([]));
      } finally {
        setLoading(false);
      }
    };

    if (santriId) loadBadges();
  }, [santriId, targetJuz, initialSetoran]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-24 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {badges.map((badge) => (
        <div
          key={badge.id}
          className={`rounded-xl border p-4 transition-all ${
            badge.isUnlocked
              ? "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white dark:border-emerald-800 dark:from-emerald-950/40 dark:to-slate-900"
              : "border-slate-200 bg-slate-50 opacity-70 dark:border-slate-800 dark:bg-slate-900/60"
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ${
                badge.isUnlocked
                  ? `bg-gradient-to-br ${badge.color} text-white`
                  : "bg-slate-200 text-slate-500 dark:bg-slate-800"
              }`}
            >
              {badge.icon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {badge.name}
                </h3>
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wide ${
                    badge.isUnlocked
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-slate-400"
                  }`}
                >
                  {badge.isUnlocked ? "Terbuka" : "Terkunci"}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {badge.description}
              </p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div
                  className={`h-full rounded-full ${
                    badge.isUnlocked ? "bg-emerald-500" : "bg-slate-400"
                  }`}
                  style={{ width: `${badge.progressPercentage}%` }}
                />
              </div>
              <p className="mt-1 text-[10px] text-slate-400 font-mono">
                {badge.currentValue}/{badge.targetValue}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
