'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import HeaderAdmin from '@/components/HeaderAdmin';
import { getBrowserSupabase } from '@/src/lib/supabase';
import { computeJuzProgress, getSantriLevel } from '@/src/utils/badgeCalculator';
import {
  FileText,
  Printer,
  ArrowLeft,
  RefreshCw,
  UserCheck,
  Users,
  BookOpen,
  Filter,
  AlertCircle,
} from 'lucide-react';

const supabase = getBrowserSupabase();

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
  jenis_setoran: string;
  nama_surah: string | null;
  juz: number | null;
  juz_selesai: boolean | null;
  ayat_mulai: number | null;
  ayat_selesai: number | null;
  nilai_kelancaran: string | null;
  nilai_tajwid: string | null;
  catatan: string | null;
  tanggal_setoran: string | null;
  created_at: string;
}

function formatTanggal(item: SetoranRecord) {
  const raw = item.tanggal_setoran || item.created_at;
  if (!raw) return '-';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function LaporanDashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [loadingSetoran, setLoadingSetoran] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [reportType, setReportType] = useState<'individual' | 'rekap'>('individual');

  const [santriList, setSantriList] = useState<SantriProfile[]>([]);
  const [selectedSantriId, setSelectedSantriId] = useState('');
  const [setoranData, setSetoranData] = useState<SetoranRecord[]>([]);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const initPage = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
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

        const list = profiles || [];
        setSantriList(list);
        if (list.length > 0) setSelectedSantriId(list[0].id);
      } catch (err: any) {
        console.error('Error fetching profiles:', err);
        setErrorMsg(err.message || 'Gagal memuat daftar santri.');
      } finally {
        setLoading(false);
      }
    };

    initPage();
  }, [router]);

  useEffect(() => {
    const fetchSetoran = async () => {
      if (reportType === 'individual' && !selectedSantriId) {
        setSetoranData([]);
        return;
      }

      setLoadingSetoran(true);
      setErrorMsg(null);

      try {
        let query = supabase
          .from('setoran_hafalan')
          .select(
            'id, santri_id, jenis_setoran, nama_surah, juz, juz_selesai, ayat_mulai, ayat_selesai, nilai_kelancaran, nilai_tajwid, catatan, tanggal_setoran, created_at'
          )
          .order('tanggal_setoran', { ascending: false })
          .order('created_at', { ascending: false });

        if (reportType === 'individual' && selectedSantriId) {
          query = query.eq('santri_id', selectedSantriId);
        }

        // Filter tanggal memakai tanggal_setoran (fallback: created_at di sisi tampilan)
        if (startDate) {
          query = query.gte('tanggal_setoran', startDate);
        }
        if (endDate) {
          query = query.lte('tanggal_setoran', endDate);
        }

        const { data, error } = await query;
        if (error) throw error;

        setSetoranData((data || []) as SetoranRecord[]);
      } catch (err: any) {
        console.error('Error fetching setoran history:', err);
        setErrorMsg(err.message || 'Gagal memuat riwayat setoran.');
        setSetoranData([]);
      } finally {
        setLoadingSetoran(false);
      }
    };

    if (!loading) fetchSetoran();
  }, [selectedSantriId, reportType, startDate, endDate, loading]);

  const handlePrint = () => window.print();

  const selectedSantri = santriList.find((s) => s.id === selectedSantriId);

  const individualProgress = useMemo(
    () => computeJuzProgress(setoranData),
    [setoranData]
  );
  const individualLevel = getSantriLevel(individualProgress.juzSelesaiCount);

  const rekapRows = useMemo(() => {
    return santriList.map((santri) => {
      const rows = setoranData.filter((s) => s.santri_id === santri.id);
      const progress = computeJuzProgress(rows);
      const level = getSantriLevel(progress.juzSelesaiCount);
      return { santri, progress, level, count: progress.totalSetoran };
    });
  }, [santriList, setoranData]);

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
      <div className="print:hidden">
        <HeaderAdmin />
      </div>

      <div className="p-4 sm:p-6 lg:p-8 print:p-0">
        <div className="max-w-6xl mx-auto space-y-6 print:max-w-none print:space-y-0">
          {/* CONTROL PANEL */}
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
                  Cetak rapor individual atau rekapitulasi kelas berdasarkan data setoran aktual.
                </p>
              </div>

              <button
                onClick={handlePrint}
                disabled={loadingSetoran}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-950/50 flex items-center gap-2 text-sm"
              >
                <Printer className="w-4 h-4" />
                Cetak Laporan (PDF)
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-200 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {errorMsg}
              </div>
            )}

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

              {reportType === 'individual' && (
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <label className="text-xs text-slate-400 whitespace-nowrap font-medium">
                    Pilih Santri:
                  </label>
                  <select
                    value={selectedSantriId}
                    onChange={(e) => setSelectedSantriId(e.target.value)}
                    className="w-full sm:w-64 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                    {santriList.length === 0 && <option value="">Belum ada santri</option>}
                    {santriList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nama_lengkap} ({s.kode_unik})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-800/80 text-xs">
              <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-emerald-400" /> Filter Tanggal Setoran:
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
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="text-emerald-400 hover:underline font-medium ml-auto"
                >
                  Reset Filter
                </button>
              )}
              {loadingSetoran && (
                <span className="text-slate-500 flex items-center gap-1.5 ml-auto">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Memuat data...
                </span>
              )}
            </div>
          </div>

          {/* DOKUMEN CETAK */}
          <div className="bg-white text-black p-8 sm:p-10 rounded-2xl shadow-2xl border border-slate-200 print:shadow-none print:border-none print:p-0">
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
                  Dicetak:{' '}
                  {new Date().toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>

            {/* INDIVIDUAL */}
            {reportType === 'individual' && selectedSantri && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <p className="text-slate-500 font-medium">Nama Santri</p>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">
                      {selectedSantri.nama_lengkap}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 font-medium">NIS / Kode PIN</p>
                    <p className="font-bold text-slate-900 font-mono mt-0.5">
                      {selectedSantri.nis || '-'} / {selectedSantri.kode_unik}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 font-medium">Juz Selesai / Level</p>
                    <p className="font-bold text-emerald-700 mt-0.5">
                      {individualProgress.juzSelesaiCount}/30 · {individualLevel.label}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 font-medium">Target Capaian</p>
                    <p className="font-bold text-slate-900 mt-0.5">{selectedSantri.target_juz} Juz</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <p className="text-[11px] text-slate-500 font-semibold">Total Setoran</p>
                    <p className="text-lg font-black text-slate-900">
                      {individualProgress.totalSetoran}
                    </p>
                  </div>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <p className="text-[11px] text-emerald-700 font-semibold">Ziyadah</p>
                    <p className="text-lg font-black text-emerald-800">
                      {individualProgress.totalZiyadah}
                    </p>
                  </div>
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-[11px] text-amber-700 font-semibold">Murajaah</p>
                    <p className="text-lg font-black text-amber-800">
                      {individualProgress.totalMurajaah}
                    </p>
                  </div>
                  <div className="p-3 bg-violet-50 border border-violet-200 rounded-lg">
                    <p className="text-[11px] text-violet-700 font-semibold">Juz Selesai</p>
                    <p className="text-lg font-black text-violet-800">
                      {individualProgress.juzSelesaiCount}
                    </p>
                  </div>
                </div>

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
                            <th className="py-2.5 px-3">Juz</th>
                            <th className="py-2.5 px-3">Surah & Ayat</th>
                            <th className="py-2.5 px-3 text-center">Kelancaran</th>
                            <th className="py-2.5 px-3 text-center">Tajwid</th>
                            <th className="py-2.5 px-3">Catatan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {setoranData.map((item, idx) => (
                            <tr key={item.id} className="hover:bg-slate-50">
                              <td className="py-2 px-3 font-mono text-slate-500">{idx + 1}</td>
                              <td className="py-2 px-3 whitespace-nowrap font-medium">
                                {formatTanggal(item)}
                              </td>
                              <td className="py-2 px-3">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                    item.jenis_setoran === 'ziyadah'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {item.jenis_setoran}
                                </span>
                              </td>
                              <td className="py-2 px-3 font-mono font-semibold">
                                {item.juz ?? '-'}
                                {item.juz_selesai ? (
                                  <span className="ml-1 text-[9px] text-emerald-700 font-bold">
                                    ✓
                                  </span>
                                ) : null}
                              </td>
                              <td className="py-2 px-3 font-bold text-slate-900">
                                {item.nama_surah || '-'} : {item.ayat_mulai ?? '-'} -{' '}
                                {item.ayat_selesai ?? '-'}
                              </td>
                              <td className="py-2 px-3 text-center font-medium">
                                {item.nilai_kelancaran || '-'}
                              </td>
                              <td className="py-2 px-3 text-center font-bold text-emerald-700">
                                {item.nilai_tajwid || '-'}
                              </td>
                              <td className="py-2 px-3 italic text-slate-600">
                                {item.catatan || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="pt-10 mt-8 grid grid-cols-2 gap-8 text-center text-xs break-inside-avoid">
                  <div>
                    <p className="text-slate-500">Mengetahui,</p>
                    <p className="font-bold text-slate-900 mt-0.5">Orang Tua / Wali Santri</p>
                    <div className="h-16" />
                    <p className="font-bold text-slate-900 underline">
                      ( ............................................ )
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Penanggung Jawab Tahfizh,</p>
                    <p className="font-bold text-slate-900 mt-0.5">Ustadz Pengampu</p>
                    <div className="h-16" />
                    <p className="font-bold text-slate-900 underline">
                      ( ............................................ )
                    </p>
                  </div>
                </div>
              </div>
            )}

            {reportType === 'individual' && !selectedSantri && (
              <p className="text-center text-sm text-slate-500 py-12">
                Belum ada data santri untuk dibuatkan rapor.
              </p>
            )}

            {/* REKAP */}
            {reportType === 'rekap' && (
              <div className="space-y-6">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex justify-between items-center">
                  <span className="font-bold text-slate-700">
                    Total Santri Terdaftar: {santriList.length} Santri
                  </span>
                  <span className="text-slate-500">
                    Total Catatan Periode: {setoranData.length} Records
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-y border-slate-300 text-slate-700 font-bold">
                        <th className="py-2.5 px-3">No</th>
                        <th className="py-2.5 px-3">Nama Santri</th>
                        <th className="py-2.5 px-3">NIS / Kode</th>
                        <th className="py-2.5 px-3 text-center">Target</th>
                        <th className="py-2.5 px-3 text-center">Juz Selesai</th>
                        <th className="py-2.5 px-3 text-center">Level</th>
                        <th className="py-2.5 px-3 text-center">Total Setoran</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {rekapRows.map(({ santri, progress, level, count }, idx) => (
                        <tr key={santri.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono text-slate-500">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">
                            {santri.nama_lengkap}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-600">
                            {santri.nis || '-'} ({santri.kode_unik})
                          </td>
                          <td className="py-2.5 px-3 text-center font-semibold text-emerald-700">
                            {santri.target_juz} Juz
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-violet-800">
                            {progress.juzSelesaiCount}/30
                          </td>
                          <td className="py-2.5 px-3 text-center font-semibold text-slate-800">
                            {level.label}
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-slate-900">
                            {count} Sesi
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {count > 0 ? (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                                Aktif
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded font-bold text-[10px]">
                                Belum Ada
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="pt-10 mt-8 flex justify-end text-center text-xs break-inside-avoid">
                  <div className="w-64">
                    <p className="text-slate-500">Koordinator Program Tahfizh,</p>
                    <div className="h-16" />
                    <p className="font-bold text-slate-900 underline">
                      ( ............................................ )
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

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
          header,
          nav,
          footer {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
