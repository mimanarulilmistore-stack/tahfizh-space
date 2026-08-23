'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { getBrowserSupabase } from '@/src/lib/supabase';
import { brand } from '@/src/config/brand';
import JuzMap from '@/components/JuzMap';
import { computeJuzProgress } from '@/src/utils/badgeCalculator';
import { 
  Search, 
  BookOpen, 
  CheckCircle2, 
  Award, 
  Calendar, 
  User, 
  Hash, 
  MessageSquare, 
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

const supabase = getBrowserSupabase();

interface SantriProfile {
  id: string;
  nama_lengkap: string;
  kode_unik: string;
  nis: string | null;
  target_juz: number;
}

interface SetoranHafalan {
  id: string;
  jenis_setoran: 'ziyadah' | 'murajaah' | string;
  nama_surah: string | null;
  juz: number | null;
  juz_selesai: boolean | null;
  ayat_mulai: number | null;
  ayat_selesai: number | null;
  nilai_kelancaran: string | null;
  nilai_tajwid: string | null;
  catatan: string | null;
  created_at: string;
}

export default function PortalSantriPage() {
  const [searchCode, setSearchCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Data State
  const [santriList, setSantriList] = useState<SantriProfile[]>([]);
  const [selectedSantri, setSelectedSantri] = useState<SantriProfile | null>(null);
  const [setoranList, setSetoranList] = useState<SetoranHafalan[]>([]);
  const [isUstadzSession, setIsUstadzSession] = useState(false);
  const [busyJuz, setBusyJuz] = useState<number | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Cek apakah ada session Ustadz yang sedang aktif
  useEffect(() => {
    const checkSessionAndFetchSantri = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsUstadzSession(true);
        // Fetch daftar santri untuk dropdown Ustadz
        const { data, error } = await supabase
          .from('profiles')
          .select('id, nama_lengkap, kode_unik, nis, target_juz')
          .eq('role', 'santri')
          .order('nama_lengkap', { ascending: true });

        if (!error && data && data.length > 0) {
          setSantriList(data);
        }
      }
    };

    checkSessionAndFetchSantri();
  }, []);

  // Fungsi pencarian data santri berdasarkan Kode Unik / PIN
  const fetchSantriDataByCode = async (codeToSearch: string) => {
    const cleanCode = codeToSearch.trim().toUpperCase();
    if (!cleanCode) {
      setErrorMsg('Masukkan kode unik / PIN santri terlebih dahulu.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSelectedSantri(null);
    setSetoranList([]);

    try {
      // 1. Ambil Profile Santri berdasarkan kode_unik
      const { data: santriData, error: santriError } = await supabase
        .from('profiles')
        .select('id, nama_lengkap, kode_unik, nis, target_juz')
        .eq('kode_unik', cleanCode)
        .single();

      if (santriError || !santriData) {
        setErrorMsg('Data santri dengan kode unik tersebut tidak ditemukan. Periksa kembali PIN Anda.');
        setLoading(false);
        return;
      }

      setSelectedSantri(santriData);

      // 2. Ambil Riwayat Setoran Hafalan Santri
      const { data: setoranData, error: setoranError } = await supabase
        .from('setoran_hafalan')
        .select(
          'id, jenis_setoran, nama_surah, juz, juz_selesai, ayat_mulai, ayat_selesai, nilai_kelancaran, nilai_tajwid, catatan, created_at'
        )
        .eq('santri_id', santriData.id)
        .order('created_at', { ascending: false });

      if (setoranError) {
        console.error('Gagal mengambil data setoran:', setoranError);
      } else {
        setSetoranList(setoranData || []);
      }
    } catch (err: any) {
      setErrorMsg('Terjadi kesalahan jaringan. Coba beberapa saat lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSantriDataByCode(searchCode);
  };

  // Kalkulasi Statistik Sederhana
  const totalSetoran = setoranList.length;
  const totalZiyadah = setoranList.filter(s => s.jenis_setoran === 'ziyadah').length;
  const totalMurajaah = setoranList.filter(s => s.jenis_setoran === 'murajaah').length;
  const juzProgress = useMemo(
    () =>
      computeJuzProgress(
        setoranList.map((item) => ({
          id: item.id,
          jenis_setoran: item.jenis_setoran,
          juz: item.juz,
          juz_selesai: item.juz_selesai,
          nilai_kelancaran: item.nilai_kelancaran,
          nilai_tajwid: item.nilai_tajwid,
        }))
      ),
    [setoranList]
  );

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const reloadSetoran = async (santriId: string) => {
    const { data, error } = await supabase
      .from('setoran_hafalan')
      .select(
        'id, jenis_setoran, nama_surah, juz, juz_selesai, ayat_mulai, ayat_selesai, nilai_kelancaran, nilai_tajwid, catatan, created_at'
      )
      .eq('santri_id', santriId)
      .order('created_at', { ascending: false });
    if (!error) setSetoranList(data || []);
  };

  const handleToggleJuzSelesai = async (
    juz: number,
    currentlyCompleted: boolean,
    hasExistingZiyadah: boolean
  ) => {
    if (!selectedSantri || !isUstadzSession || busyJuz != null) return;

    setBusyJuz(juz);
    try {
      if (currentlyCompleted) {
        const { error } = await supabase
          .from('setoran_hafalan')
          .update({ juz_selesai: false })
          .eq('santri_id', selectedSantri.id)
          .eq('juz', juz)
          .eq('jenis_setoran', 'ziyadah');
        if (error) throw error;
        showToast('success', `Tanda Juz ${juz} selesai dibatalkan.`);
        await reloadSetoran(selectedSantri.id);
        return;
      }

      const existingZiyadah = setoranList.filter(
        (s) => s.jenis_setoran === 'ziyadah' && Number(s.juz) === juz
      );

      if (existingZiyadah.length > 0 || hasExistingZiyadah) {
        const latest = existingZiyadah[0];
        if (!latest) throw new Error(`Tidak menemukan setoran ziyadah untuk Juz ${juz}.`);
        const { error } = await supabase
          .from('setoran_hafalan')
          .update({ juz_selesai: true })
          .eq('id', latest.id);
        if (error) throw error;
      } else {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.user?.id) {
          throw new Error('Sesi ustadz tidak ditemukan. Silakan login ulang.');
        }
        const today = new Date().toISOString().split('T')[0];
        const { error } = await supabase.from('setoran_hafalan').insert([
          {
            santri_id: selectedSantri.id,
            ustadz_id: session.user.id,
            jenis_setoran: 'ziyadah',
            nama_surah: `Penyelesaian Juz ${juz}`,
            juz,
            juz_selesai: true,
            ayat_mulai: 1,
            ayat_selesai: 1,
            tanggal_setoran: today,
            nilai_kelancaran: 'Lancar',
            nilai_tajwid: 'Sangat Baik',
            catatan: 'Ditandai selesai belakangan oleh ustadz',
          },
        ]);
        if (error) throw error;
      }

      showToast('success', `Juz ${juz} berhasil ditandai selesai.`);
      await reloadSetoran(selectedSantri.id);
    } catch (err: any) {
      showToast('error', err.message || 'Gagal menandai juz selesai.');
    } finally {
      setBusyJuz(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        {toast && (
          <div
            className={`fixed top-4 right-4 z-[60] max-w-sm p-4 rounded-xl border flex items-start gap-3 shadow-2xl ${
              toast.type === 'success'
                ? 'bg-emerald-950/95 border-emerald-800 text-emerald-200'
                : 'bg-rose-950/95 border-rose-800 text-rose-200'
            }`}
          >
            <p className="text-sm">{toast.text}</p>
          </div>
        )}
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold tracking-wide uppercase mb-1">
              <Sparkles className="w-4 h-4" />
              Portal Mutaba&apos;ah {brand.name}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Capaian Progres Hafalan Santri
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Pantau perkembangan ziyadah dan murajaah Al-Qur'an secara langsung dan transparan.
            </p>
          </div>

          {isUstadzSession && (
            <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-800/60 px-3 py-1.5 rounded-full text-emerald-300 text-xs font-medium w-fit">
              <ShieldCheck className="w-4 h-4" />
              Sesi Ustadz Aktif
            </div>
          )}
        </div>

        {/* SEARCH / ACCESS FORM SECTION */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <Search className="w-5 h-5 text-emerald-400" />
            Cari Data Santri via Kode Unik (PIN)
          </h2>

          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Hash className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                placeholder="Masukkan Kode Unik (Contoh: SNT-001)"
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all uppercase tracking-wider font-mono text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:bg-slate-800 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Memuat...
                </>
              ) : (
                <>
                  Lihat Progres
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Select untuk Ustadz */}
          {isUstadzSession && santriList.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400">Pilih Cepat Santri:</span>
              {santriList.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSearchCode(s.kode_unik);
                    fetchSantriDataByCode(s.kode_unik);
                  }}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 rounded-lg text-xs text-slate-300 transition-all font-mono"
                >
                  {s.nama_lengkap} ({s.kode_unik})
                </button>
              ))}
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="mt-4 p-3.5 bg-rose-950/50 border border-rose-800/60 rounded-xl text-rose-300 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              {errorMsg}
            </div>
          )}
        </div>

        {/* SANTRI DETAIL & PROGRESS DASHBOARD */}
        {selectedSantri && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            
            {/* PROFIL RINGKAS SANTRI */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <User className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedSantri.nama_lengkap}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1 font-mono">
                    <span>NIS: {selectedSantri.nis || '-'}</span>
                    <span>•</span>
                    <span className="bg-emerald-950 border border-emerald-800/80 text-emerald-300 px-2 py-0.5 rounded">
                      Kode: {selectedSantri.kode_unik}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6">
                <div>
                  <p className="text-xs text-slate-400">Target Hafalan</p>
                  <p className="text-lg font-bold text-white mt-0.5">{selectedSantri.target_juz} Juz</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Total Setoran</p>
                  <p className="text-lg font-bold text-emerald-400 mt-0.5">{totalSetoran} Kali</p>
                </div>
              </div>
            </div>

            {/* METRICS CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">Total Riwayat Setoran</span>
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-2xl font-bold text-white mt-2">{totalSetoran}</p>
                <p className="text-xs text-slate-500 mt-1">Sesi evaluasi tercatat</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">Setoran Ziyadah (Baru)</span>
                  <Award className="w-4 h-4 text-blue-400" />
                </div>
                <p className="text-2xl font-bold text-blue-400 mt-2">{totalZiyadah}</p>
                <p className="text-xs text-slate-500 mt-1">Penambahan hafalan baru</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">Setoran Murajaah (Ulang)</span>
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-2xl font-bold text-amber-400 mt-2">{totalMurajaah}</p>
                <p className="text-xs text-slate-500 mt-1">Penguatan hafalan lama</p>
              </div>
            </div>

            <JuzMap
              completedJuz={juzProgress.juzSelesaiList}
              startedJuz={juzProgress.juzDimulaiList}
              targetJuz={selectedSantri.target_juz || 30}
              variant="dark"
              interactive={isUstadzSession}
              busyJuz={busyJuz}
              disabled={busyJuz != null || !isUstadzSession}
              onToggleJuz={isUstadzSession ? handleToggleJuzSelesai : undefined}
            />

            {/* TIMELINE RIWAYAT SETORAN */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-400" />
                Riwayat & Catatan Evaluasi Ustadz
              </h3>

              {setoranList.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl">
                  <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 font-medium">Belum ada riwayat setoran hafalan.</p>
                  <p className="text-xs text-slate-500 mt-1">Setoran baru dari Ustadz akan otomatis tampil di sini.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {setoranList.map((item) => (
                    <div 
                      key={item.id}
                      className="bg-slate-950 border border-slate-800/80 hover:border-slate-700/80 rounded-xl p-5 transition-all space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-3">
                        <div className="flex items-center gap-3">
                          <span 
                            className={`px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider ${
                              item.jenis_setoran === 'ziyadah'
                                ? 'bg-blue-950 border border-blue-800/80 text-blue-300'
                                : 'bg-amber-950 border border-amber-800/80 text-amber-300'
                            }`}
                          >
                            {item.jenis_setoran}
                          </span>
                          <h4 className="text-base font-bold text-white">
                            Surah {item.nama_surah} <span className="text-slate-400 font-normal text-sm">(Ayat {item.ayat_mulai} - {item.ayat_selesai})</span>
                          </h4>
                        </div>
                        <span className="text-xs text-slate-500 font-mono">
                          {new Date(item.created_at).toLocaleDateString('id-ID', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>

                      {/* NILAI KELANCARAN & TAJWID */}
                      <div className="flex flex-wrap gap-4 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400">Kelancaran:</span>
                          <span className="font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-900 px-2 py-0.5 rounded">
                            {item.nilai_kelancaran || '-'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400">Tajwid:</span>
                          <span className="font-semibold text-sky-400 bg-sky-950/60 border border-sky-900 px-2 py-0.5 rounded">
                            {item.nilai_tajwid || '-'}
                          </span>
                        </div>
                      </div>

                      {/* CATATAN USTADZ */}
                      {item.catatan && (
                        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 text-xs text-slate-300 flex items-start gap-2.5">
                          <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold text-slate-200 block mb-0.5">Catatan Ustadz:</span>
                            <p className="text-slate-400 leading-relaxed">{item.catatan}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}