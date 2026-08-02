'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { QRCodeSVG } from 'qrcode.react';
import HeaderAdmin from '@/components/HeaderAdmin';
import { 
  Printer, 
  Search, 
  RefreshCw, 
  ArrowLeft, 
  ShieldCheck, 
  QrCode, 
  Users,
  CheckSquare,
  Square
} from 'lucide-react';

// Inisialisasi Supabase Client
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

export default function CetakKartuPinPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [santriList, setSantriList] = useState<SantriProfile[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [originUrl, setOriginUrl] = useState('');

  // 1. Authentikasi & Fetch Data Santri
  useEffect(() => {
    const initPage = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/login');
          return;
        }

        // Dapatkan origin URL untuk keperluan pembuatan QR Code
        if (typeof window !== 'undefined') {
          setOriginUrl(window.location.origin);
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('id, nama_lengkap, kode_unik, nis, target_juz')
          .eq('role', 'santri')
          .order('nama_lengkap', { ascending: true });

        if (error) throw error;

        const profiles = data || [];
        setSantriList(profiles);
        // Default: Pilih semua santri untuk dicetak
        setSelectedIds(profiles.map(p => p.id));
      } catch (err) {
        console.error('Error fetching santri for print:', err);
      } finally {
        setLoading(false);
      }
    };

    initPage();
  }, [router]);

  // Handler Pilih / Unselect Semua Santri
  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredSantri.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredSantri.map(s => s.id));
    }
  };

  // Handler Toggle Per Santri
  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Trigger Print Native Browser
  const handlePrint = () => {
    window.print();
  };

  // Filter Data Berdasarkan Search Input
  const filteredSantri = santriList.filter(s => 
    s.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.kode_unik.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.nis && s.nis.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Daftar Santri yang siap dicetak di Grid
  const printableSantri = santriList.filter(s => selectedIds.includes(s.id));

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-6 py-4 rounded-2xl shadow-xl">
          <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
          <span className="text-sm font-medium text-slate-300">Memuat Modul Cetak Kartu PIN...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans print:bg-white print:text-black print:min-h-0">
      
      {/* HEADER NAVIGASI (DISEMBUNYIKAN SAAT DICETAK) */}
      <div className="print:hidden">
        <HeaderAdmin />
      </div>

      <div className="p-4 sm:p-6 lg:p-8 print:p-0">
        <div className="max-w-6xl mx-auto space-y-6 print:max-w-none print:space-y-0">
          
          {/* CONTROL PANEL UTAMA (DISEMBUNYIKAN SAAT DICETAK) */}
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
                  <QrCode className="w-6 h-6 text-emerald-400" />
                  Cetak Kartu Akses PIN Wali Santri
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Pilih santri yang ingin dicetak kartu aksesnya. Kartu sudah diformat khusus agar pas 8 kartu per lembar A4.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrint}
                  disabled={printableSantri.length === 0}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-950/50 flex items-center gap-2 text-sm"
                >
                  <Printer className="w-4 h-4" />
                  Cetak {printableSantri.length} Kartu Selected
                </button>
              </div>
            </div>

            {/* FILTER & SELEKSI */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={handleToggleSelectAll}
                  className="px-3.5 py-2 bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 font-semibold rounded-xl flex items-center gap-2 transition-all"
                >
                  {selectedIds.length === filteredSantri.length && filteredSantri.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-500" />
                  )}
                  Pilih Semua ({filteredSantri.length})
                </button>
                <span className="text-xs text-slate-400 font-mono">
                  Terpilih: <strong className="text-emerald-400">{selectedIds.length}</strong> Santri
                </span>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari Santri / Kode..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
            </div>

            {/* DAFTAR CHECKBOX SANTRI */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 max-h-48 overflow-y-auto p-2 bg-slate-950 border border-slate-800/80 rounded-xl">
              {filteredSantri.map((santri) => {
                const isSelected = selectedIds.includes(santri.id);
                return (
                  <div
                    key={santri.id}
                    onClick={() => handleToggleSelect(santri.id)}
                    className={`cursor-pointer p-2.5 rounded-lg border text-xs transition-all flex items-center gap-2 ${
                      isSelected 
                        ? 'bg-emerald-950/40 border-emerald-700/80 text-emerald-200' 
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {isSelected ? <CheckSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <Square className="w-3.5 h-3.5 text-slate-600 shrink-0" />}
                    <span className="truncate font-semibold">{santri.nama_lengkap}</span>
                  </div>
                );
              })}
            </div>

          </div>

          {/* AREA HAFALAN & TAMPILAN KARTU (Satu Grid untuk Layar & Print A4) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl print:bg-transparent print:border-none print:p-0 print:shadow-none">
            
            <div className="print:hidden mb-4 pb-2 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                Pratinjau Kartu Siap Cetak ({printableSantri.length})
              </h2>
              <span className="text-[11px] text-slate-500">
                Gunakan Kertas A4 (Layout Otomatis 2 Kolom)
              </span>
            </div>

            {printableSantri.length === 0 ? (
              <div className="text-center py-12 text-slate-500 print:hidden">
                <QrCode className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Tidak ada santri yang dipilih untuk dicetak.</p>
              </div>
            ) : (
              /* GRID UTAMA KARTU (PRINT-OPTIMIZED A4 GRID) */
              <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-4 print:gap-3 print:w-full">
                {printableSantri.map((santri) => {
                  const portalUrl = `${originUrl}/dashboard/santri?code=${santri.kode_unik}`;

                  return (
                    <div 
                      key={santri.id}
                      className="bg-slate-950 border-2 border-emerald-800/60 print:border-slate-900 print:bg-white text-slate-100 print:text-black rounded-xl p-4 flex flex-col justify-between shadow-md relative overflow-hidden break-inside-avoid print:h-[62mm]"
                    >
                      {/* ACCENT HEADER BAR */}
                      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 print:bg-black" />

                      {/* TOP SECTION: KOP LEMBAGA */}
                      <div className="flex items-start justify-between gap-2 border-b border-slate-800 print:border-slate-300 pb-2.5 mt-1">
                        <div>
                          <div className="flex items-center gap-1.5 text-emerald-400 print:text-emerald-800 font-extrabold text-[11px] tracking-wider uppercase">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            TAHFIZH SPACE
                          </div>
                          <p className="text-[9px] text-slate-400 print:text-slate-600 font-medium">
                            Kartu Akses Pantau Wali Santri
                          </p>
                        </div>
                        <span className="text-[9px] font-mono bg-emerald-950 text-emerald-300 print:bg-slate-100 print:text-slate-800 border border-emerald-800/80 print:border-slate-300 px-2 py-0.5 rounded font-bold">
                          KODE: {santri.kode_unik}
                        </span>
                      </div>

                      {/* MIDDLE SECTION: DATA SANTRI & QR CODE */}
                      <div className="my-2.5 flex items-center justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-[10px] text-slate-400 print:text-slate-500 uppercase font-semibold">
                            Nama Santri
                          </p>
                          <h3 className="text-sm print:text-base font-extrabold text-white print:text-black leading-tight">
                            {santri.nama_lengkap}
                          </h3>
                          <p className="text-[10px] text-slate-300 print:text-slate-700 font-mono mt-0.5">
                            NIS: {santri.nis || '-'} | Target: {santri.target_juz} Juz
                          </p>
                        </div>

                        {/* GENERATED QR CODE */}
                        <div className="bg-white p-1.5 rounded-lg border border-slate-200 shrink-0 shadow-sm">
                          <QRCodeSVG 
                            value={portalUrl}
                            size={56}
                            level="M"
                            includeMargin={false}
                          />
                        </div>
                      </div>

                      {/* BOTTOM SECTION: PIN & INSTRUKSI */}
                      <div className="pt-2 border-t border-slate-800/80 print:border-slate-300 flex items-center justify-between gap-2 bg-slate-900/50 print:bg-slate-50 -mx-4 -mb-4 p-2.5 px-4 rounded-b-xl">
                        <div>
                          <p className="text-[8px] text-slate-400 print:text-slate-600 leading-tight">
                            Pindai QR Code atau buka portal santri lalu masukkan PIN:
                          </p>
                          <p className="text-xs font-mono font-black text-emerald-400 print:text-emerald-800 tracking-wider">
                            PIN: {santri.kode_unik}
                          </p>
                        </div>
                        <div className="text-[8px] text-right font-semibold text-slate-500 print:text-slate-600">
                          Resmi & Rahasia
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

          </div>

        </div>
      </div>

      {/* STYLES KHUSUS CETAK PRINTER (A4 CSS) */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm;
          }
          body {
            background: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Sembunyikan semua elemen kecuali area print */
          header, nav, footer {
            display: none !important;
          }
        }
      `}</style>

    </div>
  );
}