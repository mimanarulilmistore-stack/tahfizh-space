'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import HeaderAdmin from '@/components/HeaderAdmin';
import { getBrowserSupabase } from '@/src/lib/supabase';
import {
  generateRandomKodeUnik,
  isPinFormatLama,
  getPinFormatLabel,
} from '@/src/utils/kodeUnik';
import { getTingkatanLabel } from '@/src/utils/tingkatan';
import {
  Printer,
  Search,
  RefreshCw,
  ArrowLeft,
  ShieldCheck,
  QrCode,
  Users,
  CheckSquare,
  Square,
  AlertCircle,
  CheckCircle,
  KeyRound,
  AlertTriangle,
} from 'lucide-react';

const supabase = getBrowserSupabase();

interface SantriProfile {
  id: string;
  nama_lengkap: string;
  kode_unik: string;
  nis: string | null;
  target_juz: number;
  tingkatan?: string | null;
}

function CetakKartuPinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectId = searchParams.get('santri_id') || '';

  const [loading, setLoading] = useState(true);
  const [santriList, setSantriList] = useState<SantriProfile[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [formatFilter, setFormatFilter] = useState<'all' | 'lama' | 'baru'>('all');
  const [originUrl, setOriginUrl] = useState('');
  const [regenerating, setRegenerating] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4500);
  };

  const generateUniqueKode = async () => {
    for (let attempt = 0; attempt < 8; attempt++) {
      const kode = generateRandomKodeUnik();
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('kode_unik', kode)
        .maybeSingle();
      if (error) {
        console.warn('Cek kode unik gagal:', error.message);
        return kode;
      }
      if (!data) return kode;
    }
    return `${generateRandomKodeUnik()}X`;
  };

  const loadSantri = async (preferSelectIds?: string[]) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, nama_lengkap, kode_unik, nis, target_juz, tingkatan')
      .eq('role', 'santri')
      .order('nama_lengkap', { ascending: true });

    if (error) throw error;
    const profiles = (data || []) as SantriProfile[];
    setSantriList(profiles);

    if (preferSelectIds && preferSelectIds.length > 0) {
      setSelectedIds(preferSelectIds.filter((id) => profiles.some((p) => p.id === id)));
    }
    return profiles;
  };

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

        if (typeof window !== 'undefined') {
          setOriginUrl(window.location.origin);
        }

        const profiles = await loadSantri(preselectId ? [preselectId] : undefined);

        // Jika masuk tanpa santri_id, default pilih yang format PIN lama (siap cetak ulang)
        if (!preselectId) {
          const lamaIds = profiles.filter((p) => isPinFormatLama(p.kode_unik)).map((p) => p.id);
          if (lamaIds.length > 0) {
            setSelectedIds(lamaIds);
            setFormatFilter('lama');
          }
        }
      } catch (err) {
        console.error('Error fetching santri for print:', err);
        showToast('error', 'Gagal memuat daftar santri.');
      } finally {
        setLoading(false);
      }
    };

    initPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, preselectId]);

  const filteredSantri = useMemo(() => {
    return santriList.filter((s) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        s.nama_lengkap.toLowerCase().includes(q) ||
        s.kode_unik.toLowerCase().includes(q) ||
        Boolean(s.nis && s.nis.toLowerCase().includes(q));
      if (!matchSearch) return false;
      if (formatFilter === 'lama') return isPinFormatLama(s.kode_unik);
      if (formatFilter === 'baru') return !isPinFormatLama(s.kode_unik);
      return true;
    });
  }, [santriList, searchQuery, formatFilter]);

  const pinLamaCount = useMemo(
    () => santriList.filter((s) => isPinFormatLama(s.kode_unik)).length,
    [santriList]
  );

  const printableSantri = santriList.filter((s) => selectedIds.includes(s.id));
  const selectedLamaCount = printableSantri.filter((s) =>
    isPinFormatLama(s.kode_unik)
  ).length;

  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredSantri.length && filteredSantri.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredSantri.map((s) => s.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handlePrint = () => {
    if (printableSantri.length === 0) return;
    window.print();
  };

  const handleRegenerateSelected = async () => {
    if (selectedIds.length === 0) {
      showToast('error', 'Pilih santri yang ingin diganti PIN-nya.');
      return;
    }

    if (
      !confirm(
        `Buat PIN format baru untuk ${selectedIds.length} santri terpilih?\n\nKartu lama / QR lama tidak berlaku lagi. Cetak ulang kartu setelah ini.`
      )
    ) {
      return;
    }

    setRegenerating(true);
    try {
      let updated = 0;
      for (const id of selectedIds) {
        const kode = await generateUniqueKode();
        const { error } = await supabase
          .from('profiles')
          .update({ kode_unik: kode })
          .eq('id', id)
          .eq('role', 'santri');
        if (error) throw error;
        updated += 1;
      }

      await loadSantri(selectedIds);
      showToast(
        'success',
        `${updated} PIN berhasil diganti ke format baru. Silakan cetak ulang kartunya.`
      );
    } catch (err: any) {
      console.error(err);
      showToast('error', err.message || 'Gagal mengganti PIN.');
    } finally {
      setRegenerating(false);
    }
  };

  const handleRegenerateOne = async (santri: SantriProfile) => {
    if (
      !confirm(
        `Buat PIN baru untuk ${santri.nama_lengkap}?\nPIN lama (${santri.kode_unik}) tidak berlaku lagi.`
      )
    ) {
      return;
    }

    setRegenerating(true);
    try {
      const kode = await generateUniqueKode();
      const { error } = await supabase
        .from('profiles')
        .update({ kode_unik: kode })
        .eq('id', santri.id)
        .eq('role', 'santri');
      if (error) throw error;
      await loadSantri([santri.id, ...selectedIds.filter((id) => id !== santri.id)]);
      setSelectedIds((prev) => (prev.includes(santri.id) ? prev : [...prev, santri.id]));
      showToast('success', `PIN baru: ${kode}. Cetak kartunya sekarang.`);
    } catch (err: any) {
      showToast('error', err.message || 'Gagal mengganti PIN.');
    } finally {
      setRegenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-6 py-4 rounded-2xl shadow-xl">
          <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
          <span className="text-sm font-medium text-slate-300">
            Memuat Modul Cetak Kartu PIN...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans print:bg-white print:text-black print:min-h-0">
      <div className="print:hidden">
        <HeaderAdmin />
      </div>

      {toast && (
        <div
          className={`print:hidden fixed top-4 right-4 z-[60] max-w-sm p-4 rounded-xl border flex items-start gap-3 shadow-2xl ${
            toast.type === 'success'
              ? 'bg-emerald-950/95 border-emerald-800 text-emerald-200'
              : 'bg-rose-950/95 border-rose-800 text-rose-200'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <p className="text-sm">{toast.text}</p>
        </div>
      )}

      <div className="p-4 sm:p-6 lg:p-8 print:p-0">
        <div className="max-w-6xl mx-auto space-y-6 print:max-w-none print:space-y-0">
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
                  Cetak / Cetak Ulang Kartu PIN
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Cetak kartu akses wali. Untuk PIN format lama, buat PIN baru dulu lalu cetak ulang.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleRegenerateSelected}
                  disabled={regenerating || selectedIds.length === 0}
                  className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold rounded-xl transition-all flex items-center gap-2 text-sm"
                >
                  {regenerating ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <KeyRound className="w-4 h-4" />
                  )}
                  Buat PIN Baru ({selectedIds.length})
                </button>
                <button
                  onClick={handlePrint}
                  disabled={printableSantri.length === 0 || regenerating}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-950/50 flex items-center gap-2 text-sm"
                >
                  <Printer className="w-4 h-4" />
                  Cetak {printableSantri.length} Kartu
                </button>
              </div>
            </div>

            {pinLamaCount > 0 && (
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-100 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p>
                  Ada <strong>{pinLamaCount}</strong> santri dengan PIN format lama/pendek.
                  Disarankan: pilih mereka → <strong>Buat PIN Baru</strong> →{' '}
                  <strong>Cetak</strong> kartu ulang. Kartu/QR lama tidak berlaku setelah PIN diganti.
                  {selectedLamaCount > 0
                    ? ` (${selectedLamaCount} format lama sedang terpilih)`
                    : ''}
                </p>
              </div>
            )}

            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleToggleSelectAll}
                  className="px-3.5 py-2 bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 font-semibold rounded-xl flex items-center gap-2 transition-all"
                >
                  {selectedIds.length === filteredSantri.length &&
                  filteredSantri.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-500" />
                  )}
                  Pilih Semua ({filteredSantri.length})
                </button>
                <span className="text-xs text-slate-400 font-mono">
                  Terpilih: <strong className="text-emerald-400">{selectedIds.length}</strong>
                </span>

                <select
                  value={formatFilter}
                  onChange={(e) =>
                    setFormatFilter(e.target.value as 'all' | 'lama' | 'baru')
                  }
                  className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                  <option value="all">Semua format PIN</option>
                  <option value="lama">Perlu cetak ulang (format lama)</option>
                  <option value="baru">Format baru saja</option>
                </select>
              </div>

              <div className="relative w-full lg:w-72">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto p-2 bg-slate-950 border border-slate-800/80 rounded-xl">
              {filteredSantri.map((santri) => {
                const isSelected = selectedIds.includes(santri.id);
                const lama = isPinFormatLama(santri.kode_unik);
                return (
                  <div
                    key={santri.id}
                    className={`p-2.5 rounded-lg border text-xs transition-all ${
                      isSelected
                        ? 'bg-emerald-950/40 border-emerald-700/80 text-emerald-200'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleSelect(santri.id)}
                      className="w-full flex items-start gap-2 text-left"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-slate-600 shrink-0 mt-0.5" />
                      )}
                      <span className="min-w-0">
                        <span className="block truncate font-semibold">
                          {santri.nama_lengkap}
                        </span>
                        <span className="block font-mono text-[10px] opacity-80 truncate">
                          {santri.kode_unik}
                        </span>
                        <span
                          className={`inline-flex mt-1 px-1.5 py-0.5 rounded border text-[9px] font-bold ${
                            lama
                              ? 'bg-amber-950 text-amber-300 border-amber-800'
                              : 'bg-slate-950 text-slate-400 border-slate-700'
                          }`}
                        >
                          {getPinFormatLabel(santri.kode_unik)}
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      disabled={regenerating}
                      onClick={() => handleRegenerateOne(santri)}
                      className="mt-2 w-full px-2 py-1 rounded-md bg-slate-950 border border-slate-700 text-[10px] font-semibold text-amber-300 hover:bg-amber-950/40 disabled:opacity-50"
                    >
                      Ganti PIN
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl print:bg-transparent print:border-none print:p-0 print:shadow-none">
            <div className="print:hidden mb-4 pb-2 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                Pratinjau Kartu Siap Cetak ({printableSantri.length})
              </h2>
              <span className="text-[11px] text-slate-500">
                Kertas A4 · Layout 2 kolom
              </span>
            </div>

            {printableSantri.length === 0 ? (
              <div className="text-center py-12 text-slate-500 print:hidden">
                <QrCode className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Tidak ada santri yang dipilih untuk dicetak.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-4 print:gap-3 print:w-full">
                {printableSantri.map((santri) => {
                  const portalUrl = `${originUrl}/santri/${santri.kode_unik}`;
                  const lama = isPinFormatLama(santri.kode_unik);

                  return (
                    <div
                      key={santri.id}
                      className="bg-slate-950 border-2 border-emerald-800/60 print:border-slate-900 print:bg-white text-slate-100 print:text-black rounded-xl p-4 flex flex-col justify-between shadow-md relative overflow-hidden break-inside-avoid print:h-[62mm]"
                    >
                      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 print:bg-black" />

                      <div className="flex items-start justify-between gap-2 border-b border-slate-800 print:border-slate-300 pb-2.5 mt-1">
                        <div>
                          <div className="flex items-center gap-1.5 text-emerald-400 print:text-emerald-800 font-extrabold text-[11px] tracking-wider uppercase">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            TAHFIZH SPACE
                          </div>
                          <p className="text-[9px] text-slate-400 print:text-slate-600 font-medium">
                            Kartu Akses Pantau Wali Santri
                            {lama ? ' · CETAK ULANG' : ''}
                          </p>
                        </div>
                        <span className="text-[9px] font-mono bg-emerald-950 text-emerald-300 print:bg-slate-100 print:text-slate-800 border border-emerald-800/80 print:border-slate-300 px-2 py-0.5 rounded font-bold">
                          KODE: {santri.kode_unik}
                        </span>
                      </div>

                      <div className="my-2.5 flex items-center justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <p className="text-[10px] text-slate-400 print:text-slate-500 uppercase font-semibold">
                            Nama Santri
                          </p>
                          <h3 className="text-sm print:text-base font-extrabold text-white print:text-black leading-tight">
                            {santri.nama_lengkap}
                          </h3>
                          <p className="text-[10px] text-slate-300 print:text-slate-700 font-mono mt-0.5">
                            NIS: {santri.nis || '-'} | Target: {santri.target_juz} Juz
                            {santri.tingkatan
                              ? ` | ${getTingkatanLabel(santri.tingkatan)}`
                              : ''}
                          </p>
                        </div>

                        <div className="bg-white p-1.5 rounded-lg border border-slate-200 shrink-0 shadow-sm">
                          <QRCodeSVG
                            value={portalUrl}
                            size={56}
                            level="M"
                            includeMargin={false}
                          />
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 print:border-slate-300 flex items-center justify-between gap-2 bg-slate-900/50 print:bg-slate-50 -mx-4 -mb-4 p-2.5 px-4 rounded-b-xl">
                        <div>
                          <p className="text-[8px] text-slate-400 print:text-slate-600 leading-tight">
                            Pindai QR untuk membuka halaman anak Anda saja:
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

export default function CetakKartuPinPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
          <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
        </div>
      }
    >
      <CetakKartuPinContent />
    </Suspense>
  );
}
