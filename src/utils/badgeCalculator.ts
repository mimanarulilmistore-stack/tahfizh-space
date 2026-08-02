export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // Emoji / Icon Identifier
  color: string; // Tailwind Color Scheme
  tier: 'bronze' | 'silver' | 'gold' | 'special';
  isUnlocked: boolean;
  progressPercentage: number;
  currentValue: number;
  targetValue: number;
}

export interface SetoranItem {
  id: string;
  jenis_setoran: string; // 'ziyadah' | 'murajaah'
  nilai_kualitas?: string; // 'mumtaz' | 'jayyid jiddan' | 'jayyid' | 'A' | 'B' | 'C'
}

export interface SantriBadgeStats {
  totalSetoran: number;
  totalZiyadah: number;
  totalMurajaah: number;
  totalMumtaz: number;
  totalJuz: number;
}

export function calculateSantriBadges(
  setoranList: SetoranItem[],
  targetJuz: number = 1
): Badge[] {
  const totalSetoran = setoranList.length;
  const totalZiyadah = setoranList.filter(s => s.jenis_setoran === 'ziyadah').length;
  const totalMurajaah = setoranList.filter(s => s.jenis_setoran === 'murajaah').length;
  const totalMumtaz = setoranList.filter(s => {
    const q = (s.nilai_kualitas || '').toLowerCase();
    return q === 'mumtaz' || q === 'a' || q === 'sangat baik';
  }).length;

  // Estimasi kasar hafalan berdasarkan setoran Ziyadah (Asumsi ~10 setoran ziaydah per juz/halaman)
  // Atau bisa disesuaikan dengan akumulasi juz dari profile
  const totalJuzCalculated = Math.floor(totalZiyadah / 10);

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
      currentValue: totalSetoran,
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
      description: 'Mendapatkan nilai Mumtaz / A sebanyak minimal 5 kali',
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
      description: 'Mencapai milestone hafalan 1 Juz penuh',
      icon: '🥉',
      color: 'from-amber-700 to-yellow-800',
      tier: 'bronze',
      isUnlocked: totalJuzCalculated >= 1 || targetJuz >= 1 && totalZiyadah >= 10,
      progressPercentage: Math.min(100, (totalZiyadah / 10) * 100),
      currentValue: Math.min(1, totalJuzCalculated),
      targetValue: 1,
    },
    {
      id: 'juz_silver',
      name: 'Pejuang 3 Juz',
      description: 'Mencapai milestone hafalan 3 Juz penuh',
      icon: '🥈',
      color: 'from-slate-300 to-slate-500',
      tier: 'silver',
      isUnlocked: totalJuzCalculated >= 3,
      progressPercentage: Math.min(100, (totalZiyadah / 30) * 100),
      currentValue: Math.min(3, totalJuzCalculated),
      targetValue: 3,
    },
    {
      id: 'juz_gold',
      name: 'Bintang 5 Juz',
      description: 'Mencapai milestone hafalan 5 Juz atau lebih',
      icon: '🏆',
      color: 'from-amber-400 to-yellow-500',
      tier: 'gold',
      isUnlocked: totalJuzCalculated >= 5,
      progressPercentage: Math.min(100, (totalZiyadah / 50) * 100),
      currentValue: Math.min(5, totalJuzCalculated),
      targetValue: 5,
    },
  ];

  return badgesDefinition;
}