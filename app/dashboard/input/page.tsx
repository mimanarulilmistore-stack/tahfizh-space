'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserSupabase } from '@/src/lib/supabase';
import { 
  BookOpen, 
  UserCheck, 
  Calendar, 
  Layers, 
  Award, 
  CheckCircle2, 
  FileText, 
  Send, 
  RefreshCw, 
  Sparkles, 
  ShieldCheck,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const supabase = getBrowserSupabase();

interface SantriOption {
  id: string;
  nama_lengkap: string;
  kode_unik: string;
  nis: string | null;
}

export default function InputSetoranPage() {
  const router = useRouter();

  // State Authentikasi & Loading
  const [loadingSession, setLoadingSession] = useState(true);
  const [ustadzId, setUstadzId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State Data Santri
  const [santriList, setSantriList] = useState<SantriOption[]>([]);
  const [loadingSantri, setLoadingSantri] = useState(true);

  // State Form Input
  const [selectedSantriId, setSelectedSantriId] = useState('');
  const [jenisSetoran, setJenisSetoran] = useState<'ziyadah' | 'murajaah'>('ziyadah');
  const [namaSurah, setNamaSurah] = useState('');
  const [juz, setJuz] = useState<number>(1);
  const [ayatMulai, setAyatMulai] = useState<string>('');
  const [ayatSelesai, setAyatSelesai] = useState<string>('');
  const [tanggalSetoran, setTanggalSetoran] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [nilaiKelancaran, setNilaiKelancaran] = useState('Lancar');
  const [nilaiTajwid, setNilaiTajwid] = useState('Sangat Baik');
  const [catatan, setCatatan] = useState('');

  // State Notification Feedback
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 1. Proteksi Route & Fetch Sesi Ustadz
  useEffect(() => {
    const checkAuthAndFetchSantri = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          // Redirect ke login jika belum ada sesi
          router.push('/login');
          return;
        }

        setUstadzId(session.user.id);

        // Fetch Daftar Santri untuk Dropdown
        const { data: santriData, error: santriError } = await supabase
          .from('profiles')
          .select('id, nama_lengkap, kode_unik, nis')
          .eq('role', 'santri')
          .order('nama_lengkap', { ascending: true });

        if (santriError) {
          console.error('Error fetching santri:', santriError);
        } else {
          setSantriList(santriData || []);
        }
      } catch (err) {
        console.error('Auth check error:', err);
      } finally {
        setLoadingSession(false);
        setLoadingSantri(false);
      }
    };

    checkAuthAndFetchSantri();
  }, [router]);

  // Reset Form setelah Submit Berhasil
  const resetForm = () => {
    setSelectedSantriId('');
    setJenisSetoran('ziyadah');
    setNamaSurah('');
    setJuz(1);
    setAyatMulai('');
    setAyatSelesai('');
    setTanggalSetoran(new Date().toISOString().split('T')[0]);
    setNilaiKelancaran('Lancar');
    setNilaiTajwid('Sangat Baik');
    setCatatan('');
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setToastMessage(null);

    // Validasi Sederhana
    if (!selectedSantriId) {
      setToastMessage({ type: 'error', text: 'Pilih nama santri terlebih dahulu!' });
      return;
    }
    if (!namaSurah.trim()) {
      setToastMessage({ type: 'error', text: 'Nama surah tidak boleh kosong!' });
      return;
    }
    if (!ayatMulai || !ayatSelesai) {
      setToastMessage({ type: 'error', text: 'Ayat mulai dan ayat selesai harus diisi!' });
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        santri_id: selectedSantriId,
        ustadz_id: ustadzId,
        jenis_setoran: jenisSetoran,
        nama_surah: namaSurah.trim(),
        juz: Number(juz),
        ayat_mulai: Number(ayatMulai),
        ayat_selesai: Number(ayatSelesai),
        tanggal_setoran: tanggalSetoran,
        nilai_kelancaran: nilaiKelancaran,
        nilai_tajwid: nilaiTajwid,
        catatan: catatan.trim() ? catatan.trim() : null,
      };

      const { error } = await supabase
        .from('setoran_hafalan')
        .insert([payload]);

      if (error) {
        throw error;
      }

      // Notifikasi Sukses & Reset Form
      setToastMessage({ 
        type: 'success', 
        text: 'Data setoran hafalan berhasil disimpan dan langsung diperbarui di portal santri!' 
      });
      resetForm();

      // Autohide toast setelah 5 detik
      setTimeout(() => {
        setToastMessage(null);
      }, 5000);

    } catch (err: any) {
      console.error('Error inserting setoran:', err);
      setToastMessage({ 
        type: 'error', 
        text: err.message || 'Gagal menyimpan setoran. Silakan periksa koneksi Anda.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Tampilan Loading saat verifikasi sesi
  if (loadingSession) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-6 py-4 rounded-2xl shadow-xl">
          <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
          <span className="text-sm font-medium text-slate-300">Memverifikasi Otentikasi Sesi Ustadz...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold tracking-wide uppercase mb-1">
              <Sparkles className="w-4 h-4" />
              Modul Pengampu Tahfizh
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Input Setoran Hafalan Santri
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Pencatatan evaluasi ziyadah dan murajaah secara realtime untuk wali santri.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-800/60 px-3.5 py-1.5 rounded-full text-emerald-300 text-xs font-medium w-fit">
            <ShieldCheck className="w-4 h-4" />
            Sesi Ustadz Terverifikasi
          </div>
        </div>

        {/* TOAST NOTIFICATION */}
        {toastMessage && (
          <div 
            className={`p-4 rounded-xl border flex items-start gap-3 transition-all animate-in fade-in duration-300 ${
              toastMessage.type === 'success' 
                ? 'bg-emerald-950/70 border-emerald-800/80 text-emerald-200' 
                : 'bg-rose-950/70 border-rose-800/80 text-rose-200'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="text-sm">
              <span className="font-semibold block">
                {toastMessage.type === 'success' ? 'Berhasil Disimpan!' : 'Terjadi Kesalahan'}
              </span>
              <p className="opacity-90 mt-0.5">{toastMessage.text}</p>
            </div>
          </div>
        )}

        {/* FORM CARD */}
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          
          {/* SECTION 1: PILIH SANTRI & JENIS SETORAN */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-slate-800">
            
            {/* Dropdown Santri */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                Pilih Santri <span className="text-rose-400">*</span>
              </label>
              <select
                value={selectedSantriId}
                onChange={(e) => setSelectedSantriId(e.target.value)}
                disabled={loadingSantri}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-sm font-medium"
              >
                <option value="">-- {loadingSantri ? 'Memuat Daftar Santri...' : 'Pilih Nama Santri'} --</option>
                {santriList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nama_lengkap} {s.nis ? `(NIS: ${s.nis})` : ''} [{s.kode_unik}]
                  </option>
                ))}
              </select>
            </div>

            {/* Toggle Jenis Setoran */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-400" />
                Jenis Setoran <span className="text-rose-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setJenisSetoran('ziyadah')}
                  className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    jenisSetoran === 'ziyadah'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Ziyadah (Baru)
                </button>

                <button
                  type="button"
                  onClick={() => setJenisSetoran('murajaah')}
                  className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    jenisSetoran === 'murajaah'
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Murajaah (Ulang)
                </button>
              </div>
            </div>

          </div>

          {/* SECTION 2: DETAIL HAFALAN & TANGGAL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-6 border-b border-slate-800">
            
            {/* Nama Surah */}
            <div className="space-y-2 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                Nama Surah <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={namaSurah}
                onChange={(e) => setNamaSurah(e.target.value)}
                placeholder="Contoh: An-Naba / Al-Baqarah"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-sm font-medium"
              />
            </div>

            {/* Juz */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                Juz (1 - 30) <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={juz}
                onChange={(e) => setJuz(Number(e.target.value))}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-sm font-medium font-mono"
              />
            </div>

            {/* Tanggal Setoran */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                Tanggal Setoran <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                value={tanggalSetoran}
                onChange={(e) => setTanggalSetoran(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-sm font-medium"
              />
            </div>

            {/* Ayat Mulai */}
            <div className="space-y-2 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Ayat Mulai <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                min={1}
                value={ayatMulai}
                onChange={(e) => setAyatMulai(e.target.value)}
                placeholder="Contoh: 1"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-sm font-medium font-mono"
              />
            </div>

            {/* Ayat Selesai */}
            <div className="space-y-2 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Ayat Selesai <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                min={1}
                value={ayatSelesai}
                onChange={(e) => setAyatSelesai(e.target.value)}
                placeholder="Contoh: 20"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-sm font-medium font-mono"
              />
            </div>

          </div>

          {/* SECTION 3: EVALUASI KELANCARAN & TAJWID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 border-b border-slate-800">
            
            {/* Kelancaran */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Nilai Kelancaran <span className="text-rose-400">*</span>
              </label>
              <select
                value={nilaiKelancaran}
                onChange={(e) => setNilaiKelancaran(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-sm font-medium"
              >
                <option value="Sangat Lancar">Sangat Lancar</option>
                <option value="Lancar">Lancar</option>
                <option value="Cukup">Cukup</option>
                <option value="Perlu Ulang">Perlu Ulang</option>
              </select>
            </div>

            {/* Tajwid */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Nilai Tajwid & Makhraj <span className="text-rose-400">*</span>
              </label>
              <select
                value={nilaiTajwid}
                onChange={(e) => setNilaiTajwid(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-sm font-medium"
              >
                <option value="Sangat Baik">Sangat Baik</option>
                <option value="Baik">Baik</option>
                <option value="Cukup">Cukup</option>
                <option value="Perlu Perbaikan">Perlu Perbaikan</option>
              </select>
            </div>

          </div>

          {/* SECTION 4: CATATAN USTADZ */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              Catatan Evaluasi / Pesan Khusus (Opsional)
            </label>
            <textarea
              rows={3}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Contoh: Perhatikan panjang pendek ikhfa pada ayat 12 dan pelafalan makhraj huruf Shad."
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-sm font-medium resize-y"
            />
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:bg-slate-800 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 text-sm tracking-wide"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Menyimpan Setoran...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Simpan & Kirim Evaluasi Hafalan
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}