'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import HeaderAdmin from '@/components/HeaderAdmin';
import { getBrowserSupabase } from '@/src/lib/supabase';
import { 
  Users, 
  BookOpen, 
  Trophy, 
  Sparkles, 
  UserPlus, 
  Search, 
  ArrowRight, 
  Trash2, 
  ExternalLink, 
  PlusCircle, 
  X, 
  ShieldCheck, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Crown,
  Award,
  Flame
} from 'lucide-react';

const supabase = getBrowserSupabase();

interface SantriProfile {
  id: string;
  nama_lengkap: string;
  kode_unik: string;
  nis: string | null;
  target_juz: number;
  created_at: string;
  total_setoran?: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();

  // State Authentikasi & Loading
  const [loadingSession, setLoadingSession] = useState(true);
  const [loadingData, setLoadingData] = useState(true);

  // State Data Main & Analytics
  const [santriList, setSantriList] = useState<SantriProfile[]>([]);
  const [totalSetoranGlobal, setTotalSetoranGlobal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // State Modal Tambah Santri
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [namaLengkap, setNamaLengkap] = useState('');
  const [nis, setNis] = useState('');
  const [targetJuz, setTargetJuz] = useState<number>(30);
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

      // Fetch Count Setoran per Santri untuk Gamifikasi / Leaderboard
      const { data: setoranData } = await supabase
        .from('setoran_hafalan')
        .select('santri_id');

      const setoranMap: Record<string, number> = {};
      if (setoranData) {
        setoranData.forEach((s) => {
          setoranMap[s.santri_id] = (setoranMap[s.santri_id] || 0) + 1;
        });
      }

      const formattedSantri = (profiles || []).map((p) => ({
        ...p,
        total_setoran: setoranMap[p.id] || 0,
      }));

      setSantriList(formattedSantri);
    } catch (err: any) {
      console.error('Fetch Dashboard Error:', err);
      setToastMessage({ type: 'error', text: 'Gagal memuat data dashboard.' });
    } finally {
      setLoadingData(false);
    }
  };

  // Helper Auto-Generate Kode Unik (Contoh: SNT-839)
  const generateRandomKode = () => {
    // 6 digit agar lebih sulit ditebak dari QR/PIN orang lain
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    return `SNT-${randomNum}`;
  };

  // Pastikan kode unik belum terpakai di database
  const generateUniqueKode = async () => {
    for (let attempt = 0; attempt < 8; attempt++) {
      const kode = generateRandomKode();
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('kode_unik', kode)
        .maybeSingle();

      if (error) {
        // Jika query gagal (mis. RLS), tetap coba pakai kode yang digenerate
        console.warn('Cek kode unik gagal, lanjut dengan kode baru:', error.message);
        return kode;
      }

      if (!data) return kode;
    }

    // Fallback lebih unik jika bentrok berulang
    return `SNT-${Date.now().toString().slice(-6)}`;
  };

  // Open Modal Handler
  const handleOpenModal = async () => {
    setNamaLengkap('');
    setNis('');
    setTargetJuz(30);
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
          kode_unik: kode,
          target_juz: Number(targetJuz) || 30,
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

  // Delete Santri Handler
  const handleDeleteSantri = async (id: string, nama: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus data santri "${nama}"? Semua riwayat setoran juga akan terhapus.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setToastMessage({ type: 'success', text: `Data santri "${nama}" berhasil dihapus.` });
      fetchDashboardData();
    } catch (err: any) {
      console.error('Delete Error:', err);
      setToastMessage({ type: 'error', text: 'Gagal menghapus data santri.' });
    }
  };

  // Gamifikasi: Helper Badge Level Santri
  const getSantriBadge = (totalSetoran: number = 0) => {
    if (totalSetoran >= 20) return { label: 'Mutaqaddim', color: 'bg-amber-950 border-amber-700 text-amber-300', icon: Crown };
    if (totalSetoran >= 10) return { label: 'Mutawassit', color: 'bg-blue-950 border-blue-700 text-blue-300', icon: Award };
    return { label: 'Mubtadi’', color: 'bg-emerald-950 border-emerald-800 text-emerald-300', icon: Sparkles };
  };

  // Filter Santri
  const filteredSantri = santriList.filter((s) => 
    s.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.kode_unik.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.nis && s.nis.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Top 3 Santri Teraktif
  const topSantri = [...santriList]
    .sort((a, b) => (b.total_setoran || 0) - (a.total_setoran || 0))
    .slice(0, 3);

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

              <div className="sm:col-span-2 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 rounded-2xl p-6 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                    <Flame className="w-4 h-4 fill-amber-400" />
                    Pemberitahuan Sistem
                  </div>
                  <h3 className="text-base font-bold text-white">Distribusi PIN Wali Santri</h3>
                  <p className="text-xs text-slate-400">Gunakan Kode Unik di tabel bawah untuk diberikan kepada Wali Santri agar bisa memantau progres tanpa login.</p>
                </div>
              </div>
            </div>

            {/* GAMIFIKASI LEADERBOARD */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    Santri Teraktif (Top Setoran)
                  </h3>
                  <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded font-mono">
                    Leaderboard
                  </span>
                </div>

                {topSantri.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">Belum ada data setoran.</p>
                ) : (
                  <div className="space-y-3">
                    {topSantri.map((s, idx) => (
                      <div key={s.id} className="flex items-center justify-between bg-slate-950 border border-slate-800/80 p-3 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                            idx === 0 ? 'bg-amber-500 text-slate-950' : idx === 1 ? 'bg-slate-300 text-slate-950' : 'bg-amber-800 text-white'
                          }`}>
                            {idx + 1}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white leading-tight">{s.nama_lengkap}</p>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{s.kode_unik}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-extrabold text-emerald-400">{s.total_setoran}</span>
                          <span className="text-[10px] text-slate-500 block">Setoran</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* TABEL MANAJEMEN SANTRI */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                Daftar Santri Terdaftar ({filteredSantri.length})
              </h2>

              <div className="relative w-full sm:w-72">
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

            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800 tracking-wider">
                  <tr>
                    <th className="px-4 py-3.5">Santri</th>
                    <th className="px-4 py-3.5">Kode Unik (PIN)</th>
                    <th className="px-4 py-3.5">Target</th>
                    <th className="px-4 py-3.5">Level Badge</th>
                    <th className="px-4 py-3.5 text-center">Total Setoran</th>
                    <th className="px-4 py-3.5 text-right">Tautan Cepat (Aksi)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {loadingData ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-500">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-400" />
                        Memuat data santri...
                      </td>
                    </tr>
                  ) : filteredSantri.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-500">
                        Tidak ada data santri yang cocok dengan pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredSantri.map((santri) => {
                      const badge = getSantriBadge(santri.total_setoran);
                      const BadgeIcon = badge.icon;

                      return (
                        <tr key={santri.id} className="hover:bg-slate-950/50 transition-all">
                          <td className="px-4 py-3.5">
                            <p className="font-bold text-white text-sm">{santri.nama_lengkap}</p>
                            <p className="text-[11px] text-slate-500 font-mono">NIS: {santri.nis || '-'}</p>
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

                          <td className="px-4 py-3.5 text-center font-bold text-emerald-400 text-sm">
                            {santri.total_setoran}
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
              <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
                
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
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

                <form onSubmit={handleCreateSantri} className="space-y-4">
                  
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

                  <div className="pt-2 flex items-center justify-end gap-3">
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