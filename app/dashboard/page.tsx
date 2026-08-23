'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import HeaderAdmin from '@/components/HeaderAdmin';
import PusatInfoAdminCard, {
  type InfoAdminItem,
} from '@/components/PusatInfoAdminCard';
import { getBrowserSupabase } from '@/src/lib/supabase';
import { features } from '@/src/config/features';
import { computeJuzProgress, getSantriLevel } from '@/src/utils/badgeCalculator';
import { generateRandomKodeUnik } from '@/src/utils/kodeUnik';
import { computeTargetMingguan } from '@/src/utils/targetMingguan';
import {
  TINGKATAN_OPTIONS,
  type TingkatanKelas,
  getTingkatanBadgeClass,
  getTingkatanLabel,
  normalizeTingkatan,
} from '@/src/utils/tingkatan';
import {
  detectSantriPerluPerhatian,
  KRITERIA_PERHATIAN_TEXT,
  type ItemPerhatian,
} from '@/src/utils/perhatianSantri';
import { 
  Users, 
  BookOpen, 
  Trophy, 
  Sparkles, 
  UserPlus, 
  Search, 
  Trash2, 
  ExternalLink, 
  PlusCircle, 
  X, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Crown,
  Award,
  Flame,
  Star,
  Pencil,
  AlertTriangle
} from 'lucide-react';

const supabase = getBrowserSupabase();

interface SantriProfile {
  id: string;
  nama_lengkap: string;
  kode_unik: string;
  nis: string | null;
  no_wa_wali?: string | null;
  target_juz: number;
  target_ziyadah_mingguan?: number | null;
  target_murajaah_mingguan?: number | null;
  tingkatan?: string | null;
  created_at: string;
  total_setoran?: number;
  juz_selesai_count?: number;
  juz_tertinggi?: number;
  setor_hari_ini?: boolean;
  target_mingguan_tertinggal?: boolean;
}

interface PengumumanAdmin {
  id: string;
  judul: string;
  isi: string;
  tingkat: 'info' | 'penting' | 'darurat';
  pinned?: boolean;
  aktif: boolean;
  tampil_mulai: string | null;
  tampil_sampai: string | null;
}

function getLocalDateKey(raw?: string | null) {
  if (!raw) return null;
  const short = String(raw).slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(short)) return short;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function AdminDashboardPage() {
  const router = useRouter();

  // State Authentikasi & Loading
  const [loadingSession, setLoadingSession] = useState(true);
  const [loadingData, setLoadingData] = useState(true);

  // State Data Main & Analytics
  const [santriList, setSantriList] = useState<SantriProfile[]>([]);
  const [perhatianList, setPerhatianList] = useState<ItemPerhatian[]>([]);
  const [pengumumanList, setPengumumanList] = useState<PengumumanAdmin[]>([]);
  const [totalSetoranGlobal, setTotalSetoranGlobal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [tingkatanFilter, setTingkatanFilter] = useState<'all' | TingkatanKelas>('all');

  // State Modal Tambah Santri
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [namaLengkap, setNamaLengkap] = useState('');
  const [nis, setNis] = useState('');
  const [noWaWali, setNoWaWali] = useState('');
  const [targetJuz, setTargetJuz] = useState<number>(30);
  const [targetZiyadahMingguan, setTargetZiyadahMingguan] = useState(3);
  const [targetMurajaahMingguan, setTargetMurajaahMingguan] = useState(2);
  const [tingkatan, setTingkatan] = useState<TingkatanKelas>('dasar');
  const [generatedKodeUnik, setGeneratedKodeUnik] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // State Toast Notification
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 1. Proteksi Sesi Ustadz & Fetch Data Aggregate
  useEffect(() => {
    const initDashboard = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          router.push('/login');
          return;
        }

        await fetchDashboardData();
      } catch (err) {
        console.error('Initialization Error:', err);
      } finally {
        setLoadingSession(false);
      }
    };

    initDashboard();
  }, [router]);

  // Function Fetch Data Santri & Metrik Setoran
  const fetchDashboardData = async () => {
    setLoadingData(true);
    try {
      const todayKey = getLocalDateKey(new Date().toISOString()) || '';

      // Fetch Santri
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'santri')
        .order('nama_lengkap', { ascending: true });

      if (profileError) throw profileError;

      // Fetch Count Total Setoran
      const { count: setoranCount, error: setoranError } = await supabase
        .from('setoran_hafalan')
        .select('*', { count: 'exact', head: true });

      if (setoranError) console.error('Error counting setoran:', setoranError);
      setTotalSetoranGlobal(setoranCount || 0);

      // Fetch setoran untuk agregasi leaderboard, level, & perhatian
      const { data: setoranData } = await supabase
        .from('setoran_hafalan')
        .select(
          'id, santri_id, jenis_setoran, juz, juz_selesai, nilai_kelancaran, nilai_tajwid, tanggal_setoran, created_at'
        );
      const { data: pengumumanData, error: pengumumanError } = await supabase
        .from('admin_pengumuman')
        .select('id, judul, isi, tingkat, pinned, aktif, tampil_mulai, tampil_sampai')
        .eq('aktif', true)
        .order('pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (pengumumanError) {
        console.error('Error fetching pengumuman:', pengumumanError);
      }

      const bySantri: Record<string, any[]> = {};
      if (setoranData) {
        setoranData.forEach((s) => {
          if (!bySantri[s.santri_id]) bySantri[s.santri_id] = [];
          bySantri[s.santri_id].push(s);
        });
      }

      const formattedSantri = (profiles || []).map((p) => {
        const rows = bySantri[p.id] || [];
        const progress = computeJuzProgress(rows);
        const weekly = computeTargetMingguan(rows, {
          targetZiyadah: p.target_ziyadah_mingguan ?? 3,
          targetMurajaah: p.target_murajaah_mingguan ?? 2,
        });
        const setorHariIni = rows.some((row) => {
          const rowKey = getLocalDateKey(row.tanggal_setoran || row.created_at);
          return rowKey === todayKey;
        });
        return {
          ...p,
          total_setoran: progress.totalSetoran,
          juz_selesai_count: progress.juzSelesaiCount,
          juz_tertinggi: progress.juzTertinggi,
          setor_hari_ini: setorHariIni,
          target_mingguan_tertinggal: weekly.hasTarget && !weekly.tercapaiSemua,
        };
      });

      setSantriList(formattedSantri);
      setPerhatianList(detectSantriPerluPerhatian(formattedSantri, bySantri));
      setPengumumanList((pengumumanData || []) as PengumumanAdmin[]);
    } catch (err: any) {
      console.error('Fetch Dashboard Error:', err);
      setToastMessage({ type: 'error', text: 'Gagal memuat data dashboard.' });
    } finally {
      setLoadingData(false);
    }
  };

  // Helper Auto-Generate Kode Unik (aman + mudah dibaca di kartu)
  const generateUniqueKode = async () => {
    for (let attempt = 0; attempt < 8; attempt++) {
      const kode = generateRandomKodeUnik();
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('kode_unik', kode)
        .maybeSingle();

      if (error) {
        console.warn('Cek kode unik gagal, lanjut dengan kode baru:', error.message);
        return kode;
      }

      if (!data) return kode;
    }

    return `${generateRandomKodeUnik()}X`;
  };

  // Open Modal Handler
  const handleOpenModal = async () => {
    setNamaLengkap('');
    setNis('');
    setNoWaWali('');
    setTargetJuz(30);
    setTargetZiyadahMingguan(3);
    setTargetMurajaahMingguan(2);
    setTingkatan('dasar');
    setModalError(null);
    setGeneratedKodeUnik(await generateUniqueKode());
    setIsModalOpen(true);
  };

  // Submit Handler Tambah Santri
  const handleCreateSantri = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaLengkap.trim()) {
      setModalError('Nama lengkap santri wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setModalError(null);
    setToastMessage(null);

    try {
      // Santri tidak punya akun auth; id harus digenerate di client
      const newId =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

      let kodeUnik = generatedKodeUnik || (await generateUniqueKode());

      const tryInsert = async (kode: string) => {
        const payload = {
          id: newId,
          nama_lengkap: namaLengkap.trim(),
          nis: nis.trim() ? nis.trim() : null,
          no_wa_wali: noWaWali.trim() ? noWaWali.trim() : null,
          kode_unik: kode,
          target_juz: Number(targetJuz) || 30,
          target_ziyadah_mingguan: Math.max(0, Number(targetZiyadahMingguan) || 0),
          target_murajaah_mingguan: Math.max(0, Number(targetMurajaahMingguan) || 0),
          tingkatan,
          role: 'santri',
        };

        return supabase.from('profiles').insert([payload]);
      };

      let { error } = await tryInsert(kodeUnik);

      // Jika bentrok kode unik, regenerate sekali lalu coba lagi
      if (error && (error.code === '23505' || /duplicate|unique/i.test(error.message))) {
        kodeUnik = await generateUniqueKode();
        setGeneratedKodeUnik(kodeUnik);
        ({ error } = await tryInsert(kodeUnik));
      }

      if (error) {
        // Pesan yang lebih jelas untuk error Supabase umum
        if (error.code === '42501' || /row-level security|RLS/i.test(error.message)) {
          throw new Error(
            'Ditolak oleh keamanan database (RLS). Jalankan kebijakan INSERT untuk role santri di Supabase SQL Editor.'
          );
        }
        if (/foreign key|auth\.users/i.test(error.message)) {
          throw new Error(
            'Kolom id masih terikat ke auth.users. Lepas foreign key profiles_id_fkey agar santri bisa ditambah tanpa akun login.'
          );
        }
        if (/null value.*id/i.test(error.message)) {
          throw new Error('Kolom id wajib diisi. Pastikan insert menyertakan UUID.');
        }
        throw error;
      }

      setToastMessage({
        type: 'success',
        text: `Santri baru "${namaLengkap}" berhasil ditambahkan dengan Kode: ${kodeUnik}`,
      });
      setIsModalOpen(false);
      setModalError(null);
      fetchDashboardData();
    } catch (err: any) {
      console.error('Insert Santri Error:', err);
      const message = err.message || 'Gagal menambahkan santri baru.';
      setModalError(message);
      setToastMessage({ type: 'error', text: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Santri Handler (hapus setoran dulu agar tidak tertinggal)
  const handleDeleteSantri = async (id: string, nama: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus data santri "${nama}"? Semua riwayat setoran juga akan terhapus.`)) {
      return;
    }

    try {
      const { error: setoranDeleteError } = await supabase
        .from('setoran_hafalan')
        .delete()
        .eq('santri_id', id);

      if (setoranDeleteError) throw setoranDeleteError;

      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setToastMessage({ type: 'success', text: `Data santri "${nama}" berhasil dihapus.` });
      fetchDashboardData();
    } catch (err: any) {
      console.error('Delete Error:', err);
      setToastMessage({ type: 'error', text: err.message || 'Gagal menghapus data santri.' });
    }
  };

  // Gamifikasi: Level berdasarkan jumlah juz selesai
  const getSantriBadge = (juzSelesaiCount: number = 0) => {
    const level = getSantriLevel(juzSelesaiCount);
    if (level.id === 'khatam') {
      return { label: level.label, color: 'bg-yellow-950 border-yellow-600 text-yellow-300', icon: Crown };
    }
    if (level.id === 'hafizh') {
      return { label: level.label, color: 'bg-violet-950 border-violet-700 text-violet-300', icon: Star };
    }
    if (level.id === 'mutaqaddim') {
      return { label: level.label, color: 'bg-amber-950 border-amber-700 text-amber-300', icon: Crown };
    }
    if (level.id === 'mutawassit') {
      return { label: level.label, color: 'bg-blue-950 border-blue-700 text-blue-300', icon: Award };
    }
    return { label: level.label, color: 'bg-emerald-950 border-emerald-800 text-emerald-300', icon: Sparkles };
  };

  // Filter Santri
  const filteredSantri = santriList.filter((s) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      s.nama_lengkap.toLowerCase().includes(q) ||
      s.kode_unik.toLowerCase().includes(q) ||
      (s.nis && s.nis.toLowerCase().includes(q));
    if (!matchSearch) return false;
    if (tingkatanFilter === 'all') return true;
    return normalizeTingkatan(s.tingkatan) === tingkatanFilter;
  });

  const getTopByTingkatan = (tingkat: TingkatanKelas) =>
    [...santriList]
      .filter((s) => normalizeTingkatan(s.tingkatan) === tingkat)
      .filter((s) => (s.juz_selesai_count || 0) > 0 || (s.total_setoran || 0) > 0)
      .sort((a, b) => {
        const juzDiff = (b.juz_selesai_count || 0) - (a.juz_selesai_count || 0);
        if (juzDiff !== 0) return juzDiff;
        return (b.total_setoran || 0) - (a.total_setoran || 0);
      })
      .slice(0, 3);

  const filteredPerhatian = useMemo(() => perhatianList, [perhatianList]);

  const operationalInfoItems = useMemo<InfoAdminItem[]>(() => {
    const todayKey = getLocalDateKey(new Date().toISOString()) || '';
    const tanpaWaCount = santriList.filter((s) => !s.no_wa_wali?.trim()).length;
    const tertinggalTargetCount = santriList.filter((s) => s.target_mingguan_tertinggal).length;
    const sudahSetorHariIniCount = santriList.filter((s) => s.setor_hari_ini).length;
    const belumSetorHariIniCount = Math.max(0, santriList.length - sudahSetorHariIniCount);
    const pengumumanAktif = features.pengumuman
      ? pengumumanList.filter((item) => {
          if (!item.aktif) return false;
          const mulai = item.tampil_mulai ? getLocalDateKey(item.tampil_mulai) : null;
          const sampai = item.tampil_sampai ? getLocalDateKey(item.tampil_sampai) : null;
          if (mulai && mulai > todayKey) return false;
          if (sampai && sampai < todayKey) return false;
          return true;
        })
      : [];

    return [
      ...pengumumanAktif.map<InfoAdminItem>((item) => ({
        id: `pengumuman-${item.id}`,
        eyebrow: item.pinned ? 'Pengumuman Dipin' : 'Pengumuman Admin',
        title: item.judul,
        description: item.isi,
        count: 1,
        unit: item.tingkat,
        tone:
          item.tingkat === 'darurat'
            ? 'danger'
            : item.tingkat === 'penting'
              ? 'warning'
              : 'info',
        actionLabel: 'Kelola pengumuman',
        onAction: () => router.push('/dashboard/pengumuman'),
      })),
      {
        id: 'perhatian',
        eyebrow: 'Pantauan Operasional',
        title:
          filteredPerhatian.length > 0 ? 'Santri Perlu Perhatian' : 'Semua pantauan aman',
        description:
          filteredPerhatian.length > 0
            ? `${filteredPerhatian.length} santri perlu ditindaklanjuti. Lihat daftar detail di bawah.`
            : 'Tidak ada santri yang masuk kriteria perhatian saat ini.',
        count: filteredPerhatian.length,
        unit: 'santri',
        tone: filteredPerhatian.length > 0 ? 'danger' : 'success',
        actionLabel: 'Lihat detail',
        onAction: () =>
          document.getElementById('perhatian-section')?.scrollIntoView({ behavior: 'smooth' }),
      },
      {
        id: 'target-mingguan',
        eyebrow: 'Progress Mingguan',
        title:
          tertinggalTargetCount > 0
            ? 'Target mingguan belum tercapai'
            : 'Target mingguan on track',
        description:
          tertinggalTargetCount > 0
            ? `${tertinggalTargetCount} santri masih tertinggal dari target ziyadah/murajaah minggu ini.`
            : 'Semua santri yang punya target mingguan sedang on track.',
        count: tertinggalTargetCount,
        unit: 'santri',
        tone: tertinggalTargetCount > 0 ? 'warning' : 'success',
        actionLabel: 'Kelola santri',
        onAction: () =>
          document.getElementById('manajemen-santri-section')?.scrollIntoView({ behavior: 'smooth' }),
      },
      {
        id: 'wa-wali',
        eyebrow: 'Data Wali',
        title: tanpaWaCount > 0 ? 'Nomor WA wali belum lengkap' : 'Nomor WA wali sudah lengkap',
        description:
          tanpaWaCount > 0
            ? `${tanpaWaCount} santri belum memiliki nomor WA wali, sehingga tombol kirim WhatsApp belum optimal.`
            : 'Semua santri sudah memiliki nomor WA wali.',
        count: tanpaWaCount,
        unit: 'santri',
        tone: tanpaWaCount > 0 ? 'info' : 'success',
        actionLabel: 'Buka daftar santri',
        onAction: () =>
          document.getElementById('manajemen-santri-section')?.scrollIntoView({ behavior: 'smooth' }),
      },
      {
        id: 'setoran-hari-ini',
        eyebrow: 'Aktivitas Hari Ini',
        title:
          belumSetorHariIniCount > 0 ? 'Masih ada yang belum setor hari ini' : 'Semua santri sudah setor hari ini',
        description:
          belumSetorHariIniCount > 0
            ? `${sudahSetorHariIniCount} santri sudah setor hari ini, ${belumSetorHariIniCount} lainnya belum.`
            : `${sudahSetorHariIniCount} santri sudah tercatat setor hari ini.`,
        count: belumSetorHariIniCount,
        unit: 'santri',
        tone: belumSetorHariIniCount > 0 ? 'warning' : 'success',
        actionLabel: 'Input massal',
        onAction: () => router.push('/dashboard/input-massal'),
      },
    ];
  }, [filteredPerhatian.length, pengumumanList, router, santriList]);

  const severityClass = (severity: 'tinggi' | 'sedang' | 'rendah') => {
    if (severity === 'tinggi') return 'bg-rose-950 text-rose-300 border-rose-800';
    if (severity === 'sedang') return 'bg-amber-950 text-amber-300 border-amber-800';
    return 'bg-slate-800 text-slate-300 border-slate-700';
  };

  if (loadingSession) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-6 py-4 rounded-2xl shadow-xl">
          <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
          <span className="text-sm font-medium text-slate-300">Memuat Dashboard Pengelola...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      
      {/* NAVIGASI HEADER LENGKAP DENGAN TOMBOL LOGOUT */}
      <HeaderAdmin />

      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* HEADER SECTION */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-6">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold tracking-wide uppercase mb-1">
                <Sparkles className="w-4 h-4" />
                Pusat Kendali Pengampu Tahfizh
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                Manajemen Data Santri & Performa Kelas
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Kelola data santri, pantau agregasi hafalan, serta distribusikan PIN akses wali santri.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleOpenModal}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-emerald-950 text-sm"
              >
                <UserPlus className="w-4 h-4" />
                Tambah Santri Baru
              </button>
            </div>
          </div>

          {/* TOAST NOTIFICATION (di atas modal) */}
          {toastMessage && (
            <div className={`fixed top-4 right-4 z-[60] max-w-sm p-4 rounded-xl border flex items-start gap-3 shadow-2xl transition-all animate-in fade-in duration-300 ${
              toastMessage.type === 'success' ? 'bg-emerald-950/95 border-emerald-800/80 text-emerald-200' : 'bg-rose-950/95 border-rose-800/80 text-rose-200'
            }`}>
              {toastMessage.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />}
              <div className="text-sm flex-1">
                <span className="font-semibold block">{toastMessage.type === 'success' ? 'Berhasil!' : 'Perhatian'}</span>
                <p className="opacity-90 mt-0.5">{toastMessage.text}</p>
              </div>
              <button
                type="button"
                onClick={() => setToastMessage(null)}
                className="text-slate-400 hover:text-white"
                aria-label="Tutup notifikasi"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STATISTIK AGREGAT & GAMIFIKASI LEADERBOARD */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* KPI METRICS */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Santri Aktif</p>
                  <p className="text-3xl font-extrabold text-white mt-1">{santriList.length}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Terdaftar dalam database</p>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Sesi Setoran</p>
                  <p className="text-3xl font-extrabold text-white mt-1">{totalSetoranGlobal}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Ziyadah & Murajaah tercatat</p>
                </div>
              </div>

              <PusatInfoAdminCard items={operationalInfoItems} />
            </div>

            {/* GAMIFIKASI LEADERBOARD PER TINGKATAN */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  Leaderboard per Tingkatan
                </h3>
                <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded font-mono">
                  Top 3
                </span>
              </div>

              <div className="space-y-4 flex-1">
                {TINGKATAN_OPTIONS.map((opt) => {
                  const tops = getTopByTingkatan(opt.value);
                  return (
                    <div key={opt.value} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded border text-[10px] font-bold ${getTingkatanBadgeClass(
                            opt.value
                          )}`}
                        >
                          {opt.label}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {
                            santriList.filter(
                              (s) => normalizeTingkatan(s.tingkatan) === opt.value
                            ).length
                          }{' '}
                          santri
                        </span>
                      </div>
                      {tops.length === 0 ? (
                        <p className="text-[11px] text-slate-500 py-1.5 px-2 rounded-lg bg-slate-950 border border-slate-800/80">
                          Belum ada setoran di tingkatan ini.
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {tops.map((s, idx) => {
                            const levelBadge = getSantriBadge(s.juz_selesai_count || 0);
                            return (
                              <div
                                key={s.id}
                                className="flex items-center justify-between bg-slate-950 border border-slate-800/80 px-2.5 py-2 rounded-lg"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div
                                    className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] shrink-0 ${
                                      idx === 0
                                        ? 'bg-amber-500 text-slate-950'
                                        : idx === 1
                                          ? 'bg-slate-300 text-slate-950'
                                          : 'bg-amber-800 text-white'
                                    }`}
                                  >
                                    {idx + 1}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-[11px] font-bold text-white truncate">
                                      {s.nama_lengkap}
                                    </p>
                                    <p className="text-[9px] text-slate-500">{levelBadge.label}</p>
                                  </div>
                                </div>
                                <div className="text-right shrink-0 pl-2">
                                  <span className="text-[11px] font-extrabold text-emerald-400">
                                    {s.juz_selesai_count || 0}
                                  </span>
                                  <span className="text-[9px] text-slate-500 block">juz</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* SANTRI PERLU PERHATIAN */}
          <div
            id="perhatian-section"
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                  Santri Perlu Perhatian
                  <span className="text-sm font-semibold text-rose-300/90">
                    ({filteredPerhatian.length})
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Kriteria: {KRITERIA_PERHATIAN_TEXT.join(' · ')}.
                </p>
              </div>
            </div>

            {loadingData ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-rose-400" />
                Memuat pantauan...
              </div>
            ) : filteredPerhatian.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-slate-800 rounded-xl">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-white">Semua aman</p>
                <p className="text-xs text-slate-500 mt-1">
                  Tidak ada santri yang masuk kriteria perhatian.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800 tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Santri</th>
                      <th className="px-4 py-3">Tingkatan</th>
                      <th className="px-4 py-3">Alasan</th>
                      <th className="px-4 py-3">Aktivitas terakhir</th>
                      <th className="px-4 py-3 text-right">Aksi cepat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredPerhatian.map((item) => (
                      <tr key={item.santri.id} className="hover:bg-slate-950/50">
                        <td className="px-4 py-3">
                          <p className="font-bold text-white text-sm">
                            {item.santri.nama_lengkap}
                          </p>
                          <p className="text-[11px] text-slate-500 font-mono">
                            {item.santri.kode_unik}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded border text-[10px] font-bold ${getTingkatanBadgeClass(
                              item.santri.tingkatan
                            )}`}
                          >
                            {getTingkatanLabel(item.santri.tingkatan)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1.5">
                            {item.reasons.map((reason) => (
                              <span
                                key={reason.id}
                                title={reason.detail}
                                className={`inline-flex px-2 py-0.5 rounded border text-[10px] font-bold ${severityClass(
                                  reason.severity
                                )}`}
                              >
                                {reason.label}
                              </span>
                            ))}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1">
                            {item.reasons.map((r) => r.detail).join(' · ')}
                          </p>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {item.lastSetoranAt ? (
                            <>
                              <p className="font-medium text-slate-200">
                                {new Date(item.lastSetoranAt).toLocaleDateString('id-ID')}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                {item.daysSinceLastSetoran != null
                                  ? `${item.daysSinceLastSetoran} hari lalu`
                                  : '-'}
                              </p>
                            </>
                          ) : (
                            <p className="text-slate-500 italic">Belum ada setoran</p>
                          )}
                          <p className="text-[10px] text-slate-600 mt-0.5">
                            Z:{item.totalZiyadah} · M:{item.totalMurajaah}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                router.push(`/dashboard/input?santri_id=${item.santri.id}`)
                              }
                              className="px-2.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/40 text-emerald-300 hover:text-white rounded-lg transition-all flex items-center gap-1 text-[11px] font-semibold"
                            >
                              <PlusCircle className="w-3.5 h-3.5" />
                              Setor
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                router.push(`/dashboard/santri/${item.santri.id}`)
                              }
                              className="px-2.5 py-1.5 bg-sky-950/40 hover:bg-sky-900 border border-sky-800/60 text-sky-300 hover:text-white rounded-lg transition-all flex items-center gap-1 text-[11px] font-semibold"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* TABEL MANAJEMEN SANTRI */}
          <div
            id="manajemen-santri-section"
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6"
          >
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                Daftar Santri Terdaftar ({filteredSantri.length})
              </h2>

              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <select
                  value={tingkatanFilter}
                  onChange={(e) =>
                    setTingkatanFilter(e.target.value as 'all' | TingkatanKelas)
                  }
                  className="px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                  <option value="all">Semua Tingkatan</option>
                  {TINGKATAN_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari Nama / NIS / Kode Unik..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 -mt-2">
              Level (juz selesai): <span className="text-emerald-400">Mubtadi&apos;</span> 0–2 ·{' '}
              <span className="text-blue-400">Mutawassit</span> 3–9 ·{' '}
              <span className="text-amber-400">Mutaqaddim</span> 10–19 ·{' '}
              <span className="text-violet-400">Hafizh</span> 20–29 ·{' '}
              <span className="text-yellow-300">Khatam</span> 30
            </p>

            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800 tracking-wider">
                  <tr>
                    <th className="px-4 py-3.5">Santri</th>
                    <th className="px-4 py-3.5">Tingkatan</th>
                    <th className="px-4 py-3.5">Kode Unik (PIN)</th>
                    <th className="px-4 py-3.5">Target</th>
                    <th className="px-4 py-3.5">Level Badge</th>
                    <th className="px-4 py-3.5 text-center">Juz Selesai</th>
                    <th className="px-4 py-3.5 text-right">Tautan Cepat (Aksi)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {loadingData ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-500">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-400" />
                        Memuat data santri...
                      </td>
                    </tr>
                  ) : filteredSantri.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-500">
                        Tidak ada data santri yang cocok dengan pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredSantri.map((santri) => {
                      const badge = getSantriBadge(santri.juz_selesai_count || 0);
                      const BadgeIcon = badge.icon;

                      return (
                        <tr key={santri.id} className="hover:bg-slate-950/50 transition-all">
                          <td className="px-4 py-3.5">
                            <p className="font-bold text-white text-sm">{santri.nama_lengkap}</p>
                            <p className="text-[11px] text-slate-500 font-mono">NIS: {santri.nis || '-'}</p>
                          </td>

                          <td className="px-4 py-3.5">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded border text-[10px] font-bold ${getTingkatanBadgeClass(
                                santri.tingkatan
                              )}`}
                            >
                              {getTingkatanLabel(santri.tingkatan)}
                            </span>
                          </td>

                          <td className="px-4 py-3.5">
                            <span className="bg-slate-950 border border-slate-700/80 text-emerald-400 font-mono px-2.5 py-1 rounded text-xs font-bold tracking-wider">
                              {santri.kode_unik}
                            </span>
                          </td>

                          <td className="px-4 py-3.5 font-semibold text-slate-200">
                            {santri.target_juz} Juz
                          </td>

                          <td className="px-4 py-3.5">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-bold ${badge.color}`}>
                              <BadgeIcon className="w-3 h-3" />
                              {badge.label}
                            </span>
                          </td>

                          <td className="px-4 py-3.5 text-center">
                            <span className="font-bold text-emerald-400 text-sm">{santri.juz_selesai_count || 0}</span>
                            <span className="block text-[10px] text-slate-500">{santri.total_setoran || 0} setoran</span>
                          </td>

                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => router.push(`/dashboard/input?santri_id=${santri.id}`)}
                                title="Input Setoran Hafalan"
                                className="px-2.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/40 text-emerald-300 hover:text-white rounded-lg transition-all flex items-center gap-1 text-[11px] font-semibold"
                              >
                                <PlusCircle className="w-3.5 h-3.5" />
                                Setor
                              </button>

                              <button
                                onClick={() => router.push(`/dashboard/santri/${santri.id}`)}
                                title="Edit profil & koreksi setoran"
                                className="px-2.5 py-1.5 bg-sky-950/40 hover:bg-sky-900 border border-sky-800/60 text-sky-300 hover:text-white rounded-lg transition-all flex items-center gap-1 text-[11px] font-semibold"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                Edit
                              </button>

                              <button
                                onClick={() => window.open(`/santri/${santri.kode_unik}`, '_blank')}
                                title="Buka Halaman Santri (tampilan wali)"
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-all border border-slate-700"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleDeleteSantri(santri.id, santri.nama_lengkap)}
                                title="Hapus Santri"
                                className="p-1.5 bg-rose-950/40 hover:bg-rose-900 border border-rose-800/60 text-rose-400 hover:text-white rounded-lg transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

          </div>

          {/* MODAL TAMBAH SANTRI BARU */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md max-h-[min(90vh,900px)] shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
                
                <div className="flex items-center justify-between border-b border-slate-800 px-6 pt-6 pb-4 shrink-0">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-emerald-400" />
                    Tambah Santri Baru
                  </h3>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateSantri} className="flex flex-col min-h-0 flex-1">
                  <div className="space-y-4 overflow-y-auto overscroll-contain px-6 py-4">
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Nama Lengkap Santri <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={namaLengkap}
                      onChange={(e) => setNamaLengkap(e.target.value)}
                      placeholder="Contoh: Muhammad Abdullah"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      NIS / Nomor Induk Santri (Opsional)
                    </label>
                    <input
                      type="text"
                      value={nis}
                      onChange={(e) => setNis(e.target.value)}
                      placeholder="Contoh: 2026001"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      No. WhatsApp Wali (Opsional)
                    </label>
                    <input
                      type="tel"
                      value={noWaWali}
                      onChange={(e) => setNoWaWali(e.target.value)}
                      placeholder="Contoh: 081234567890"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                    <p className="text-[11px] text-slate-500">
                      Dipakai untuk tombol &quot;Kirim via WhatsApp&quot; setelah setoran.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Tingkatan Kelas <span className="text-rose-400">*</span>
                    </label>
                    <select
                      required
                      value={tingkatan}
                      onChange={(e) => setTingkatan(e.target.value as TingkatanKelas)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    >
                      {TINGKATAN_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label} — {opt.description}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-500">
                      Generik untuk semua jenjang (setara kelas awal–lanjut). Leaderboard dipisah per tingkatan.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Target Hafalan (Juz)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={targetJuz}
                      onChange={(e) => setTargetJuz(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">
                        Target Ziyadah / Minggu
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={30}
                        value={targetZiyadahMingguan}
                        onChange={(e) => setTargetZiyadahMingguan(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">
                        Target Murajaah / Minggu
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={30}
                        value={targetMurajaahMingguan}
                        onChange={(e) => setTargetMurajaahMingguan(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 -mt-2">
                    Default 3 ziyadah + 2 murajaah. Progress tampil di portal wali (Senin–Minggu).
                  </p>

                  <div className="space-y-1.5 bg-slate-950 border border-slate-800 p-3 rounded-xl">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-slate-400">Kode Unik / PIN Portal (Otomatis)</label>
                      <button
                        type="button"
                        onClick={async () => setGeneratedKodeUnik(await generateUniqueKode())}
                        className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" /> ACAK KODE
                      </button>
                    </div>
                    <p className="text-base font-mono font-extrabold text-emerald-400 tracking-wider">
                      {generatedKodeUnik}
                    </p>
                  </div>

                  {modalError && (
                    <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-200 text-xs flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                      <p>{modalError}</p>
                    </div>
                  )}

                  </div>

                  <div className="shrink-0 border-t border-slate-800 px-6 py-4 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-all"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-950 flex items-center gap-2"
                    >
                      {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Simpan Santri'}
                    </button>
                  </div>

                </form>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}