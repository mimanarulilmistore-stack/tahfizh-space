'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import HeaderAdmin from '@/components/HeaderAdmin';
import { 
  FileText, 
  Printer, 
  ArrowLeft, 
  RefreshCw, 
  UserCheck, 
  Users, 
  BookOpen, 
  Award, 
  Calendar,
  Filter,
  CheckCircle2
} from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface SantriProfile {
  id: string;
  nama_lengkap: string;
  kode_unik: string;
  nis: string | null;
  target_juz: number;
}

interface SetoranRecord {
  id: string;
  santri_id: string;
  tanggal: string;
  jenis_setoran: string; // 'ziyadah' | 'murajaah'
  surah: string;
  ayat_mulai: number;
  ayat_selesai: number;
  nilai_kuantitas: string;
  nilai_kualitas: string;
  catatan: string | null;
}

export default function LaporanDashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState<'individual' | 'rekap'>('individual');
  
  const [santriList, setSantriList] = useState<SantriProfile[]>([]);
  const [selectedSantriId, setSelectedSantriId] = useState<string>('');
  const [setoranData, setSetoranData] = useState<SetoranRecord[]>([]);
  
  // Filter Tanggal
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // 1. Fetch Daftar Santri & Inisialisasi Sesi
  useEffect(() => {
    const initPage = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/login');
          return;
        }

        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('id, nama_lengkap, kode_unik, nis, target_juz')
          .eq('role', 'santri')
          .order('nama_lengkap', { ascending: true });

        if (error) throw error;

        if (profiles && profiles.length > 0) {
          setSantriList(profiles);
          setSelectedSantriId(profiles[0].id);
        }
      } catch (err) {
        console.error('Error fetching profiles:', err);
      } finally {
        setLoading(false);
      }
    };

    initPage();
  }, [router]);

  // 2. Fetch Data Setoran Berdasarkan Santri / Filter
  useEffect(() => {
    const fetchSetoran = async () => {
      if (!selectedSantriId && reportType === 'individual') return;

      try {
        let query = supabase
          .from('setoran_hafalan')
          .select('*')
          .order('tanggal', { ascending: false });

        if (reportType === 'individual' && selectedSantriId) {
          query = query.eq('santri_id', selectedSantriId);
        }

        if (startDate) {
          query = query.gte('tanggal', startDate);
        }
        if (endDate) {
          query = query.lte('tanggal', endDate);
        }

        const { data, error } = await query;
        if (error) throw error;

        setSetoranData(data || []);
      } catch (err) {
        console.error('Error fetching setoran history:', err);
      }
    };

    if (!loading) {
      fetchSetoran();
    }
  }, [selectedSantriId, reportType, startDate, endDate, loading]);

  const handlePrint = () => {
    window.print();
  };

  const selectedSantri = santriList.find(s => s.id === selectedSantriId);

  // Kalkulasi Metrik Santri Terpilih
  const totalSetoran = setoranData.length;
  const totalZiyadah = setoranData.filter(s => s.jenis_setoran === 'ziyadah').length;
  const totalMurajaah = setoranData.filter(s => s.jenis_setoran === 'murajaah').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-6 py-4 rounded-2xl shadow-xl">
          <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
          <span className="text-sm font-medium text-slate-300">Memuat Modul Laporan & Rapor...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans print:bg-white print:text-black print:min-h-0">
      
      {/* HEADER NAVIGATION (HIDDEN ON PRINT) */}
      <div className="print:hidden">
        <HeaderAdmin />
      </div>

      <div className="p-4 sm:p-6 lg:p-8 print:p-0">
        <div className="max-w-6xl mx-auto space-y-6 print:max-w-none print:space-y-0">
          
          {/* CONTROL PANEL UTAMA (HIDDEN ON PRINT) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl print:hidden space-y-6">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="text-xs text-emerald-400 hover:underline flex items-center gap-1.5 mb-2 font-medium"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Dashboard
                </button>
                <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                  <FileText className="w-6 h-6 text-emerald-400" />
                  Laporan & Rapor Progress Santri
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Cetak rapor individual santri untuk wali murid atau rekapitulasi capaian seluruh kelas.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrint}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-950/50 flex items-center gap-2 text-sm"
                >
                  <Printer className="w-4 h-4" />
                  Cetak Laporan (PDF)
                </button>
              </div>
            </div>

            {/* TAB SELEKSI MODE LAPORAN */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 w-full sm:w-auto">
                <button
                  onClick={() => setReportType('individual')}
                  className={`flex-1 sm:flex-none px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                    reportType === 'individual'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  Rapor Santri (Individual)
                </button>

                <button
                  onClick={() => setReportType('rekap')}
                  className={`flex-1 sm:flex-none px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                    reportType === 'rekap'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Rekapitulasi Kelas
                </button>
              </div>

              {/* FILTER PILIHAN SANTRI (JIKA MODE INDIVIDUAL) */}
              {reportType === 'individual' && (
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <label className="text-xs text-slate-400 whitespace-nowrap font-medium">Pilih Santri:</label>
                  <select
                    value={selectedSantriId}
                    onChange={(e) => setSelectedSantriId(e.target.value)}
                    className="w-full sm:w-64 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                    {santriList.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.nama_lengkap} ({s.kode_unik})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* FILTER RENTANG TANGGAL */}
            <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-800/80 text-xs">
              <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-emerald-400" /> Filter Tanggal:
              </span>
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Dari:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Sampai:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              {(startDate || endDate) && (
                <button
                  onClick={() => { setStartDate(''); setEndDate(''); }}
                  className="text-emerald-400 hover:underline font-medium ml-auto"
                >
                  Reset Filter
                </button>
              )}
            </div>

          </div>

          {/* AREA DOKUMEN CETAK (PRINT CONTAINER) */}
          <div className="bg-white text-black p-8 sm:p-10 rounded-2xl shadow-2xl border border-slate-200 print:shadow-none print:border-none print:p-0">
            
            {/* KOP SURAT RESMI (PRINT READY) */}
            <div className="border-b-2 border-black pb-4 mb-6 flex items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black tracking-wider uppercase text-slate-900">
                  TAHFIZH SPACE
                </h1>
                <p className="text-xs text-slate-600 font-medium">
                  Lembaga Pendidikan Tahfizh Al-Qur&apos;an Modern & Terpadu
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Sistem Informasi & Mutaba&apos;ah Perkembangan Hafalan Santri
                </p>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-slate-100 border border-slate-300 rounded text-xs font-bold font-mono text-slate-800">
                  {reportType === 'individual' ? 'RAPOR SANTRI' : 'REKAPITULASI KELAS'}
                </span>
                <p className="text-[10px] text-slate-500 mt-1">
                  Dicetak pada: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>

            {/* ISI LAPORAN MODE INDIVIDUAL */}
            {reportType === 'individual' && selectedSantri && (
              <div className="space-y-6">
                
                {/* IDENTITAS SANTRI */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <p className="text-slate-500 font-medium">Nama Santri</p>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedSantri.nama_lengkap}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 font-medium">NIS / Kode PIN</p>
                    <p className="font-bold text-slate-900 font-mono mt-0.5">{selectedSantri.nis || '-'} / {selectedSantri.kode_unik}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 font-medium">Target Capaian</p>
                    <p className="font-bold text-emerald-700 mt-0.5">{selectedSantri.target_juz} Juz</p>
                  </div>
                  <div>
                    <p className="text-slate-500 font-medium">Total Sesi Setoran</p>
                    <p className="font-bold text-slate-900 mt-0.5">{totalSetoran} Sesi</p>
                  </div>
                </div>

                {/* METRIK STATISTIK RINGKAS */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <p className="text-[11px] text-slate-500 font-semibold">Total Setoran</p>
                    <p className="text-lg font-black text-slate-900">{totalSetoran}</p>
                  </div>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <p className="text-[11px] text-emerald-700 font-semibold">Ziyadah (Baru)</p>
                    <p className="text-lg font-black text-emerald-800">{totalZiyadah}</p>
                  </div>
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-[11px] text-amber-700 font-semibold">Murajaah (Ulang)</p>
                    <p className="text-lg font-black text-amber-800">{totalMurajaah}</p>
                  </div>
                </div>

                {/* TABEL DETAIL RIWAYAT SETORAN */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                    Rincian Catatan Setoran Hafalan
                  </h3>

                  {setoranData.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-slate-300 rounded-xl text-slate-500 text-xs">
                      Belum ada catatan setoran hafalan pada periode ini.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 border-y border-slate-300 text-slate-700 font-bold">
                            <th className="py-2.5 px-3">No</th>
                            <th className="py-2.5 px-3">Tanggal</th>
                            <th className="py-2.5 px-3">Jenis</th>
                            <th className="py-2.5 px-3">Surah & Ayat</th>
                            <th className="py-2.5 px-3 text-center">Kuantitas</th>
                            <th className="py-2.5 px-3 text-center">Kualitas</th>
                            <th className="py-2.5 px-3">Catatan Ustadz</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {setoranData.map((item, idx) => (
                            <tr key={item.id} className="hover:bg-slate-50">
                              <td className="py-2 px-3 font-mono text-slate-500">{idx + 1}</td>
                              <td className="py-2 px-3 whitespace-nowrap font-medium">
                                {new Date(item.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                              </td>
                              <td className="py-2 px-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  item.jenis_setoran === 'ziyadah'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {item.jenis_setoran}
                                </span>
                              </td>
                              <td className="py-2 px-3 font-bold text-slate-900">
                                {item.surah} : {item.ayat_mulai} - {item.ayat_selesai}
                              </td>
                              <td className="py-2 px-3 text-center font-medium">{item.nilai_kuantitas || '-'}</td>
                              <td className="py-2 px-3 text-center font-bold text-emerald-700">{item.nilai_kualitas || '-'}</td>
                              <td className="py-2 px-3 italic text-slate-600">{item.catatan || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* FOOTER TANDA TANGAN */}
                <div className="pt-10 mt-8 grid grid-cols-2 gap-8 text-center text-xs break-inside-avoid">
                  <div>
                    <p className="text-slate-500">Mengetahui,</p>
                    <p className="font-bold text-slate-900 mt-0.5">Orang Tua / Wali Santri</p>
                    <div className="h-16"></div>
                    <p className="font-bold text-slate-900 underline">( ............................................ )</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Penanggung Jawab Tahfizh,</p>
                    <p className="font-bold text-slate-900 mt-0.5">Ustadz Pengampu</p>
                    <div className="h-16"></div>
                    <p className="font-bold text-slate-900 underline">( ............................................ )</p>
                  </div>
                </div>

              </div>
            )}

            {/* ISI LAPORAN MODE REKAPITULASI KELAS */}
            {reportType === 'rekap' && (
              <div className="space-y-6">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex justify-between items-center">
                  <span className="font-bold text-slate-700">Total Santri Terdaftar: {santriList.length} Santri</span>
                  <span className="text-slate-500">Total Akumulasi Catatan: {setoranData.length} Records</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-y border-slate-300 text-slate-700 font-bold">
                        <th className="py-2.5 px-3">No</th>
                        <th className="py-2.5 px-3">Nama Santri</th>
                        <th className="py-2.5 px-3">NIS / Kode</th>
                        <th className="py-2.5 px-3 text-center">Target</th>
                        <th className="py-2.5 px-3 text-center">Total Setoran</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {santriList.map((santri, idx) => {
                        const count = setoranData.filter(s => s.santri_id === santri.id).length;
                        return (
                          <tr key={santri.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-mono text-slate-500">{idx + 1}</td>
                            <td className="py-2.5 px-3 font-bold text-slate-900">{santri.nama_lengkap}</td>
                            <td className="py-2.5 px-3 font-mono text-slate-600">{santri.nis || '-'} ({santri.kode_unik})</td>
                            <td className="py-2.5 px-3 text-center font-semibold text-emerald-700">{santri.target_juz} Juz</td>
                            <td className="py-2.5 px-3 text-center font-bold text-slate-900">{count} Sesi</td>
                            <td className="py-2.5 px-3 text-center">
                              {count > 0 ? (
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">Aktif</span>
                              ) : (
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded font-bold text-[10px]">Belum Ada</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* FOOTER TANDA TANGAN REKAP */}
                <div className="pt-10 mt-8 flex justify-end text-center text-xs break-inside-avoid">
                  <div className="w-64">
                    <p className="text-slate-500">Koordinator Program Tahfizh,</p>
                    <div className="h-16"></div>
                    <p className="font-bold text-slate-900 underline">( ............................................ )</p>
                  </div>
                </div>

              </div>
            )}

          </div>

        </div>
      </div>

      {/* GLOBAL CSS UNTUK KERTAS A4 & PRINT */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 15mm;
          }
          body {
            background: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          header, nav, footer {
            display: none !important;
          }
        }
      `}</style>

    </div>
  );
}