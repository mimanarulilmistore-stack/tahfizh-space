'use client';

import React from 'react';
import { Badge } from '@/utils/badgeCalculator';
import { Award, Lock, CheckCircle2 } from 'lucide-react';

interface SantriBadgesGridProps {
  badges: Badge[];
  showOnlyUnlocked?: boolean;
}

export default function SantriBadgesGrid({ 
  badges, 
  showOnlyUnlocked = false 
}: SantriBadgesGridProps) {
  const displayedBadges = showOnlyUnlocked 
    ? badges.filter(b => b.isUnlocked) 
    : badges;

  const unlockedCount = badges.filter(b => b.isUnlocked).length;

  return (
    <div className="space-y-4">
      
      {/* HEADER BADGES STATS */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm font-bold text-white tracking-wide">
            Lencana & Pencapaian Santri
          </h3>
        </div>
        <span className="text-xs font-mono font-semibold px-2.5 py-1 bg-amber-950/60 border border-amber-800/80 text-amber-300 rounded-lg">
          {unlockedCount} / {badges.length} Terbuka
        </span>
      </div>

      {/* GRID LENCANA */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {displayedBadges.map((badge) => (
          <div
            key={badge.id}
            className={`relative overflow-hidden rounded-xl p-3.5 border transition-all duration-300 flex flex-col justify-between ${
              badge.isUnlocked
                ? 'bg-slate-900/90 border-slate-700/80 shadow-lg hover:border-slate-500 hover:scale-[1.02]'
                : 'bg-slate-950/40 border-slate-800/60 opacity-60 grayscale'
            }`}
          >
            {/* ACCENT GLOW SAAT UNLOCKED */}
            {badge.isUnlocked && (
              <div 
                className={`absolute -top-10 -right-10 w-20 h-20 bg-gradient-to-br ${badge.color} opacity-20 blur-xl rounded-full pointer-events-none`} 
              />
            )}

            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-2xl filter drop-shadow">{badge.icon}</span>
                {badge.isUnlocked ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <Lock className="w-4 h-4 text-slate-600 shrink-0" />
                )}
              </div>

              <h4 className="text-xs font-bold text-white leading-snug">
                {badge.name}
              </h4>
              <p className="text-[10px] text-slate-400 mt-1 leading-normal line-clamp-2">
                {badge.description}
              </p>
            </div>

            {/* PROGRESS BAR UNTUK BADGE YANG BELUM UNLOCKED */}
            {!badge.isUnlocked && (
              <div className="mt-3 pt-2 border-t border-slate-800/60">
                <div className="flex justify-between items-center text-[9px] text-slate-500 font-mono mb-1">
                  <span>Progress</span>
                  <span>{badge.currentValue}/{badge.targetValue}</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-500"
                    style={{ width: `${badge.progressPercentage}%` }}
                  />
                </div>
              </div>
            )}

            {badge.isUnlocked && (
              <div className="mt-3 pt-1 text-[9px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Tercapai
              </div>
            )}
          </div>
        ))}
      </div>

    </div>
  );
}