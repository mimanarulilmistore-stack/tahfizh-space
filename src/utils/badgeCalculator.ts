export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  tier: 'bronze' | 'silver' | 'gold' | 'special';
  isUnlocked: boolean;
  progressPercentage: number;
  currentValue: number;
  targetValue: number;
}

export interface SetoranItem {
  id: string;
  jenis_setoran: string; // 'ziyadah' | 'murajaah'
  juz?: number | null;
  juz_selesai?: boolean | null;
  nilai_kelancaran?: string | null;
  nilai_tajwid?: string | null;
  nilai_kualitas?: string;
}

export type SantriLevelId =
  | 'mubtadi'
  | 'mutawassit'
  | 'mutaqaddim'
  | 'hafizh'
  | 'khatam';

export interface SantriLevel {
  id: SantriLevelId;
  label: string;
  description: string;
  minJuz: number;
  nextMin: number | null;
}

/** Level berdasarkan jumlah juz yang sudah ditandai selesai. */
export const SANTRI_LEVELS: SantriLevel[] = [
  { id: 'mubtadi', label: "Mubtadi'", description: '0–2 juz selesai', minJuz: 0, nextMin: 3 },
  { id: 'mutawassit', label: 'Mutawassit', description: '3–9 juz selesai', minJuz: 3, nextMin: 10 },
  { id: 'mutaqaddim', label: 'Mutaqaddim', description: '10–19 juz selesai', minJuz: 10, nextMin: 20 },
  { id: 'hafizh', label: 'Hafizh', description: '20–29 juz selesai', minJuz: 20, nextMin: 30 },
  { id: 'khatam', label: 'Khatam', description: '30 juz selesai', minJuz: 30, nextMin: null },
];

export interface JuzProgress {
  /** Nomor juz yang sudah ditandai selesai (unik, 1–30) */
  juzSelesaiList: number[];
  /** Juz yang sudah mulai ziyadah tapi belum ditandai selesai */
  juzDimulaiList: number[];
  /** Jumlah juz selesai */
  juzSelesaiCount: number;
  /** Juz tertinggi yang pernah disetor sebagai ziyadah */
  juzTertinggi: number;
  totalZiyadah: number;
  totalMurajaah: number;
  totalSetoran: number;
  totalMumtaz: number;
}

export function getSantriLevel(juzSelesaiCount: number = 0): SantriLevel {
  if (juzSelesaiCount >= 30) return SANTRI_LEVELS[4];
  if (juzSelesaiCount >= 20) return SANTRI_LEVELS[3];
  if (juzSelesaiCount >= 10) return SANTRI_LEVELS[2];
  if (juzSelesaiCount >= 3) return SANTRI_LEVELS[1];
  return SANTRI_LEVELS[0];
}

function isMumtazNilai(...nilaiList: Array<string | null | undefined>): boolean {
  return nilaiList.some((raw) => {
    const q = (raw || '').toLowerCase().trim();
    return (
      q === 'mumtaz' ||
      q === 'a' ||
      q === 'sangat baik' ||
      q === 'sangat lancar'
    );
  });
}

/** Hitung progres juz dari riwayat setoran (hanya ziyadah yang menambah juz). */
export function computeJuzProgress(setoranList: SetoranItem[]): JuzProgress {
  const completed = new Set<number>();
  const started = new Set<number>();
  let juzTertinggi = 0;
  let totalZiyadah = 0;
  let totalMurajaah = 0;
  let totalMumtaz = 0;

  for (const s of setoranList) {
    if (isMumtazNilai(s.nilai_kelancaran, s.nilai_tajwid, s.nilai_kualitas)) {
      totalMumtaz += 1;
    }

    if (s.jenis_setoran === 'murajaah') {
      totalMurajaah += 1;
      continue;
    }

    if (s.jenis_setoran !== 'ziyadah') continue;
    totalZiyadah += 1;

    const j = Number(s.juz);
    if (!Number.isFinite(j) || j < 1 || j > 30) continue;

    const juzNum = Math.floor(j);
    juzTertinggi = Math.max(juzTertinggi, juzNum);
    started.add(juzNum);
    if (s.juz_selesai) completed.add(juzNum);
  }

  const juzSelesaiList = [...completed].sort((a, b) => a - b);
  const juzDimulaiList = [...started]
    .filter((j) => !completed.has(j))
    .sort((a, b) => a - b);

  return {
    juzSelesaiList,
    juzDimulaiList,
    juzSelesaiCount: juzSelesaiList.length,
    juzTertinggi,
    totalZiyadah,
    totalMurajaah,
    totalSetoran: setoranList.length,
    totalMumtaz,
  };
}

const JUZ_MILESTONES = [
  { id: 'juz_1', name: 'Pionir 1 Juz', target: 1, icon: '🥉', color: 'from-amber-700 to-yellow-800', tier: 'bronze' as const },
  { id: 'juz_3', name: 'Pejuang 3 Juz', target: 3, icon: '🥈', color: 'from-slate-300 to-slate-500', tier: 'silver' as const },
  { id: 'juz_5', name: 'Bintang 5 Juz', target: 5, icon: '🏆', color: 'from-amber-400 to-yellow-500', tier: 'gold' as const },
  { id: 'juz_10', name: 'Penjelajah 10 Juz', target: 10, icon: '🧭', color: 'from-cyan-500 to-blue-600', tier: 'silver' as const },
  { id: 'juz_15', name: 'Penjaga 15 Juz', target: 15, icon: '📿', color: 'from-indigo-500 to-violet-600', tier: 'gold' as const },
  { id: 'juz_20', name: 'Pendaki 20 Juz', target: 20, icon: '⛰️', color: 'from-orange-500 to-rose-600', tier: 'gold' as const },
  { id: 'juz_25', name: 'Hampir Khatam 25 Juz', target: 25, icon: '🌙', color: 'from-violet-500 to-fuchsia-600', tier: 'special' as const },
  { id: 'juz_30', name: 'Khatam 30 Juz', target: 30, icon: '👑', color: 'from-amber-300 to-yellow-500', tier: 'special' as const },
];

export function calculateSantriBadges(setoranList: SetoranItem[]): Badge[] {
  const progress = computeJuzProgress(setoranList);
  const { juzSelesaiCount, totalSetoran, totalZiyadah, totalMurajaah, totalMumtaz } = progress;

  const baseBadges: Badge[] = [
    {
      id: 'first_step',
      name: 'Langkah Pertama',
      description: 'Menyelesaikan setoran hafalan pertama',
      icon: '🚀',
      color: 'from-emerald-500 to-teal-600',
      tier: 'bronze',
      isUnlocked: totalSetoran >= 1,
      progressPercentage: Math.min(100, (totalSetoran / 1) * 100),
      currentValue: Math.min(totalSetoran, 1),
      targetValue: 1,
    },
    {
      id: 'ziyadah_warrior',
      name: 'Pejuang Ziyadah',
      description: 'Menyelesaikan minimal 10 kali setoran ziyadah',
      icon: '⚡',
      color: 'from-amber-500 to-orange-600',
      tier: 'silver',
      isUnlocked: totalZiyadah >= 10,
      progressPercentage: Math.min(100, (totalZiyadah / 10) * 100),
      currentValue: totalZiyadah,
      targetValue: 10,
    },
    {
      id: 'murajaah_master',
      name: 'Penjaga Hafalan',
      description: 'Menyelesaikan minimal 15 kali murajaah',
      icon: '🛡️',
      color: 'from-blue-500 to-indigo-600',
      tier: 'silver',
      isUnlocked: totalMurajaah >= 15,
      progressPercentage: Math.min(100, (totalMurajaah / 15) * 100),
      currentValue: totalMurajaah,
      targetValue: 15,
    },
    {
      id: 'murajaah_istiqamah',
      name: 'Murajaah Istiqamah',
      description: 'Menyelesaikan minimal 30 kali murajaah',
      icon: '🔁',
      color: 'from-sky-500 to-blue-700',
      tier: 'gold',
      isUnlocked: totalMurajaah >= 30,
      progressPercentage: Math.min(100, (totalMurajaah / 30) * 100),
      currentValue: totalMurajaah,
      targetValue: 30,
    },
    {
      id: 'murajaah_sejati',
      name: 'Penjaga Hafalan Sejati',
      description: 'Menyelesaikan minimal 60 kali murajaah',
      icon: '💎',
      color: 'from-teal-400 to-emerald-700',
      tier: 'special',
      isUnlocked: totalMurajaah >= 60,
      progressPercentage: Math.min(100, (totalMurajaah / 60) * 100),
      currentValue: totalMurajaah,
      targetValue: 60,
    },
    {
      id: 'mumtaz_student',
      name: 'Bintang Mumtaz',
      description: 'Nilai Sangat Baik / Sangat Lancar minimal 5 kali',
      icon: '⭐',
      color: 'from-purple-500 to-pink-600',
      tier: 'gold',
      isUnlocked: totalMumtaz >= 5,
      progressPercentage: Math.min(100, (totalMumtaz / 5) * 100),
      currentValue: totalMumtaz,
      targetValue: 5,
    },
  ];

  const juzBadges: Badge[] = JUZ_MILESTONES.map((m) => ({
    id: m.id,
    name: m.name,
    description: `Menyelesaikan ${m.target} juz (ditandai selesai oleh ustadz)`,
    icon: m.icon,
    color: m.color,
    tier: m.tier,
    isUnlocked: juzSelesaiCount >= m.target,
    progressPercentage: Math.min(100, (juzSelesaiCount / m.target) * 100),
    currentValue: Math.min(juzSelesaiCount, m.target),
    targetValue: m.target,
  }));

  return [...baseBadges, ...juzBadges];
}
