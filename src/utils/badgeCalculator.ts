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
  nilai_kelancaran?: string | null;
  nilai_tajwid?: string | null;
  /** @deprecated gunakan nilai_kelancaran / nilai_tajwid */
  nilai_kualitas?: string;
}

export type SantriLevelId = 'mubtadi' | 'mutawassit' | 'mutaqaddim';

export interface SantriLevel {
  id: SantriLevelId;
  label: string;
  description: string;
  minSetoran: number;
  nextMin: number | null;
}

export const SANTRI_LEVELS: SantriLevel[] = [
  {
    id: 'mubtadi',
    label: "Mubtadi'",
    description: '0–9 setoran',
    minSetoran: 0,
    nextMin: 10,
  },
  {
    id: 'mutawassit',
    label: 'Mutawassit',
    description: '10–19 setoran',
    minSetoran: 10,
    nextMin: 20,
  },
  {
    id: 'mutaqaddim',
    label: 'Mutaqaddim',
    description: '20+ setoran',
    minSetoran: 20,
    nextMin: null,
  },
];

/** Level dashboard berdasarkan total setoran (ziyadah + murajaah). */
export function getSantriLevel(totalSetoran: number = 0): SantriLevel {
  if (totalSetoran >= 20) return SANTRI_LEVELS[2];
  if (totalSetoran >= 10) return SANTRI_LEVELS[1];
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

/**
 * Estimasi kasar: ~10 ziyadah ≈ 1 juz.
 * Digunakan hanya untuk badge milestone, bukan laporan resmi.
 */
const ZIYADAH_PER_JUZ = 10;

export function calculateSantriBadges(
  setoranList: SetoranItem[],
  _targetJuz: number = 30
): Badge[] {
  const totalSetoran = setoranList.length;
  const totalZiyadah = setoranList.filter((s) => s.jenis_setoran === 'ziyadah').length;
  const totalMurajaah = setoranList.filter((s) => s.jenis_setoran === 'murajaah').length;
  const totalMumtaz = setoranList.filter((s) =>
    isMumtazNilai(s.nilai_kelancaran, s.nilai_tajwid, s.nilai_kualitas)
  ).length;

  const totalJuzCalculated = Math.floor(totalZiyadah / ZIYADAH_PER_JUZ);

  const badgesDefinition: Badge[] = [
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
      description: 'Menyelesaikan minimal 10 kali setoran hafalan baru (Ziyadah)',
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
      description: 'Menyelesaikan minimal 15 kali setoran pengulangan (Murajaah)',
      icon: '🛡️',
      color: 'from-blue-500 to-indigo-600',
      tier: 'silver',
      isUnlocked: totalMurajaah >= 15,
      progressPercentage: Math.min(100, (totalMurajaah / 15) * 100),
      currentValue: totalMurajaah,
      targetValue: 15,
    },
    {
      id: 'mumtaz_student',
      name: 'Bintang Mumtaz',
      description: 'Mendapatkan nilai Sangat Baik / Sangat Lancar minimal 5 kali',
      icon: '⭐',
      color: 'from-purple-500 to-pink-600',
      tier: 'gold',
      isUnlocked: totalMumtaz >= 5,
      progressPercentage: Math.min(100, (totalMumtaz / 5) * 100),
      currentValue: totalMumtaz,
      targetValue: 5,
    },
    {
      id: 'juz_bronze',
      name: 'Pionir 1 Juz',
      description: 'Estimasi capaian ~1 Juz (10 setoran ziyadah)',
      icon: '🥉',
      color: 'from-amber-700 to-yellow-800',
      tier: 'bronze',
      isUnlocked: totalJuzCalculated >= 1,
      progressPercentage: Math.min(100, (totalZiyadah / ZIYADAH_PER_JUZ) * 100),
      currentValue: Math.min(1, totalJuzCalculated),
      targetValue: 1,
    },
    {
      id: 'juz_silver',
      name: 'Pejuang 3 Juz',
      description: 'Estimasi capaian ~3 Juz (30 setoran ziyadah)',
      icon: '🥈',
      color: 'from-slate-300 to-slate-500',
      tier: 'silver',
      isUnlocked: totalJuzCalculated >= 3,
      progressPercentage: Math.min(100, (totalZiyadah / (ZIYADAH_PER_JUZ * 3)) * 100),
      currentValue: Math.min(3, totalJuzCalculated),
      targetValue: 3,
    },
    {
      id: 'juz_gold',
      name: 'Bintang 5 Juz',
      description: 'Estimasi capaian ~5 Juz (50 setoran ziyadah)',
      icon: '🏆',
      color: 'from-amber-400 to-yellow-500',
      tier: 'gold',
      isUnlocked: totalJuzCalculated >= 5,
      progressPercentage: Math.min(100, (totalZiyadah / (ZIYADAH_PER_JUZ * 5)) * 100),
      currentValue: Math.min(5, totalJuzCalculated),
      targetValue: 5,
    },
  ];

  return badgesDefinition;
}
