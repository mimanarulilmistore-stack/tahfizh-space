'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import HeaderAdmin from '@/components/HeaderAdmin';
import { getBrowserSupabase } from '@/src/lib/supabase';
import {
  TINGKATAN_OPTIONS,
  type TingkatanKelas,
  getTingkatanBadgeClass,
  getTingkatanLabel,
  normalizeTingkatan,
} from '@/src/utils/tingkatan';
import {
  DEFAULT_NOMINAL_SPP,
  STATUS_SPP_OPTIONS,
  type StatusSpp,
  currentPeriodeKey,
  formatPeriodeLabel,
  formatRupiah,
  getStatusSppBadgeClass,
  hitungRekapSpp,
  normalizeStatusSpp,
} from '@/src/utils/spp';
import {
  buildPesanSppWali,
  buildWhatsAppClickToChatUrl,
} from '@/src/utils/pesanWali';
import { features } from '@/src/config/features';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  MessageCircle,
  RefreshCw,
  Save,
  Users,
  Wallet,
} from 'lucide-react';

const supabase = getBrowserSupabase();

type SantriOption = {
  id: string;
  nama_lengkap: string;
  kode_unik: string;
  nis: string | null;
  tingkatan: string | null;
  no_wa_wali: string | null;
};

type SppRow = {
  santri_id: string;
  status: string;
  nominal: number | string;
  tanggal_bayar: string | null;
  catatan: string | null;
};

type DraftEntry = {
  status: StatusSpp;
  catatan: string;
  tanggal_bayar: string;
};

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  if (err && typeof err === 'object' && 'message' in err) {
    const msg = String((err as { message?: unknown }).message || '').trim();
    if (msg) return msg;
  }
  return fallback;
}

function isMissingSppTable(err: unknown): boolean {
  const code =
    err && typeof err === 'object' && 'code' in err
      ? String((err as { code?: unknown }).code || '')
      : '';
  const message = getErrorMessage(err, '').toLowerCase();
  return (
    code === '42P01' ||
    code === 'PGRST205' ||
    ((/spp_pembayaran|spp_pengaturan/.test(message) &&
      /does not exist|not find|could not find|schema cache/i.test(message)))
  );
}

function pesanErrorSpp(err: unknown, mode: 'muat' | 'simpan'): string {
  if (isMissingSppTable(err)) {
    return 'Tabel SPP belum siap di database. Buka Supabase → SQL Editor, jalankan file supabase/fix-spp-bulanan.sql, lalu muat ulang halaman ini.';
  }
  const detail = getErrorMessage(err, '');
  if (mode === 'muat') {
    return detail ? `Gagal memuat data SPP: ${detail}` : 'Gagal memuat data SPP.';
  }
  return detail || 'Gagal menyimpan data SPP.';
}

export default function SppPage() {
  const router = useRouter();
  const [loadingSession, setLoadingSession] = useState(true);
  const [loadingSpp, setLoadingSpp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ustadzId, setUstadzId] = useState<string | null>(null);

  const [santriList, setSantriList] = useState<SantriOption[]>([]);
  const [periode, setPeriode] = useState(currentPeriodeKey());
  const [tingkatanFilter, setTingkatanFilter] = useState<'all' | TingkatanKelas>('all');
  const [nominalDefault, setNominalDefault] = useState(DEFAULT_NOMINAL_SPP);
  const [draft, setDraft] = useState<Record<string, DraftEntry>>({});
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  useEffect(() => {
    const init = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          router.push('/login');
          return;
        }
        setUstadzId(session.user.id);

        const { data, error } = await supabase
          .from('profiles')
          .select('id, nama_lengkap, kode_unik, nis, tingkatan, no_wa_wali')
          .eq('role', 'santri')
          .order('nama_lengkap', { ascending: true });

        if (error) throw error;
        setSantriList((data || []) as SantriOption[]);

        const { data: setting, error: settingError } = await supabase
          .from('spp_pengaturan')
          .select('nominal_default')
          .eq('id', 1)
          .maybeSingle();

        if (settingError) throw settingError;
        if (setting?.nominal_default != null) {
          setNominalDefault(Number(setting.nominal_default) || DEFAULT_NOMINAL_SPP);
        }
      } catch (err) {
        console.error('Init SPP error:', err);
        setToast({
          type: 'error',
          text: isMissingSppTable(err)
            ? pesanErrorSpp(err, 'muat')
            : 'Gagal memuat daftar santri / pengaturan SPP.',
        });
      } finally {
        setLoadingSession(false);
      }
    };
    init();
  }, [router]);

  const loadSpp = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('spp_pembayaran')
        .select('santri_id, status, nominal, tanggal_bayar, catatan')
        .eq('periode', periode);

      if (error) throw error;

      const next: Record<string, DraftEntry> = {};
      (data || []).forEach((row: SppRow) => {
        const status = normalizeStatusSpp(row.status) || 'belum';
        next[row.santri_id] = {
          status,
          catatan: row.catatan || '',
          tanggal_bayar: row.tanggal_bayar || '',
        };
      });
      setDraft(next);
    } catch (err) {
      console.error('Load SPP error:', err);
      setToast({ type: 'error', text: pesanErrorSpp(err, 'muat') });
    } finally {
      setLoadingSpp(false);
    }
  }, [periode]);

  const handlePeriodeChange = (value: string) => {
    setLoadingSpp(true);
    setPeriode(value);
  };

  useEffect(() => {
    if (loadingSession) return;
    const run = async () => {
      await loadSpp();
    };
    run();
  }, [loadingSession, loadSpp]);

  const filteredSantri = useMemo(() => {
    if (tingkatanFilter === 'all') return santriList;
    return santriList.filter((s) => normalizeTingkatan(s.tingkatan) === tingkatanFilter);
  }, [santriList, tingkatanFilter]);

  const getStatus = (santriId: string): StatusSpp =>
    draft[santriId]?.status ?? 'belum';

  const setStatus = (santriId: string, status: StatusSpp) => {
    setDraft((prev) => {
      const current = prev[santriId];
      return {
        ...prev,
        [santriId]: {
          status,
          catatan: current?.catatan ?? '',
          tanggal_bayar:
            status === 'lunas'
              ? current?.tanggal_bayar || new Date().toISOString().slice(0, 10)
              : '',
        },
      };
    });
  };

  const setCatatan = (santriId: string, catatan: string) => {
    setDraft((prev) => {
      const status = prev[santriId]?.status ?? 'belum';
      return {
        ...prev,
        [santriId]: {
          status,
          catatan,
          tanggal_bayar: prev[santriId]?.tanggal_bayar ?? '',
        },
      };
    });
  };

  const markAll = (status: StatusSpp) => {
    setDraft((prev) => {
      const next = { ...prev };
      const today = new Date().toISOString().slice(0, 10);
      filteredSantri.forEach((s) => {
        next[s.id] = {
          status,
          catatan: next[s.id]?.catatan ?? '',
          tanggal_bayar: status === 'lunas' ? next[s.id]?.tanggal_bayar || today : '',
        };
      });
      return next;
    });
  };

  const handleKirimWaPengingat = (santri: SantriOption) => {
    if (getStatus(santri.id) === 'lunas') {
      setToast({
        type: 'error',
        text: `${santri.nama_lengkap} sudah berstatus Lunas — pengingat tidak dikirim.`,
      });
      return;
    }
    if (!santri.no_wa_wali?.trim()) {
      setToast({
        type: 'error',
        text: `Nomor WA wali ${santri.nama_lengkap} belum diisi. Lengkapi di Kelola Santri.`,
      });
      return;
    }
    const pesan = buildPesanSppWali({
      namaSantri: santri.nama_lengkap,
      noWaWali: santri.no_wa_wali,
      periodeLabel: formatPeriodeLabel(periode),
      nominal: nominalDefault,
      formatNominal: formatRupiah,
    });
    const url = buildWhatsAppClickToChatUrl(santri.no_wa_wali, pesan);
    if (!url) {
      setToast({
        type: 'error',
        text: `Nomor WA wali ${santri.nama_lengkap} tidak valid. Periksa format nomor di Kelola Santri.`,
      });
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const rekap = useMemo(() => {
    return hitungRekapSpp(
      filteredSantri.map((s) => ({
        status: draft[s.id]?.status ?? 'belum',
        nominal: nominalDefault,
      }))
    );
  }, [filteredSantri, draft, nominalDefault]);

  const handleSaveNominalDefault = async () => {
    const nilai = Math.max(0, Math.round(Number(nominalDefault) || 0));
    setNominalDefault(nilai);
    try {
      const { error } = await supabase.from('spp_pengaturan').upsert({
        id: 1,
        nominal_default: nilai,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      setToast({
        type: 'success',
        text: `Nominal default SPP disimpan: ${formatRupiah(nilai)}.`,
      });
      setTimeout(() => setToast(null), 4000);
    } catch (err) {
      setToast({ type: 'error', text: pesanErrorSpp(err, 'simpan') });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setToast(null);

    if (!ustadzId) {
      setToast({ type: 'error', text: 'Sesi admin tidak valid. Silakan login ulang.' });
      return;
    }

    if (filteredSantri.length === 0) {
      setToast({ type: 'error', text: 'Tidak ada santri pada filter ini.' });
      return;
    }

    const payloads = filteredSantri.map((s) => {
      const entry = draft[s.id];
      const status: StatusSpp = entry?.status ?? 'belum';
      return {
        santri_id: s.id,
        periode,
        nominal: Math.max(0, Math.round(Number(nominalDefault) || 0)),
        status,
        tanggal_bayar:
          status === 'lunas'
            ? entry?.tanggal_bayar || new Date().toISOString().slice(0, 10)
            : null,
        catatan: entry?.catatan?.trim() ? entry.catatan.trim() : null,
        created_by: ustadzId,
      };
    });

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('spp_pembayaran')
        .upsert(payloads, { onConflict: 'santri_id,periode' });
      if (error) throw error;

      setToast({
        type: 'success',
        text: `SPP ${formatPeriodeLabel(periode)} tersimpan untuk ${payloads.length} santri.`,
      });
      setLoadingSpp(true);
      loadSpp();
      setTimeout(() => setToast(null), 6000);
    } catch (err) {
      console.error('Simpan SPP error:', err);
      setToast({ type: 'error', text: pesanErrorSpp(err, 'simpan') });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingSession) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-6 py-4 rounded-2xl shadow-xl">
          <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
          <span className="text-sm font-medium text-slate-300">Memuat Modul SPP...</span>
        </div>
      </div>
    );
  }

  const inputCls =
    'w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <HeaderAdmin />

      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="text-xs text-emerald-400 hover:underline flex items-center gap-1.5 mb-2 font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Dashboard
              </button>
              <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold tracking-wide uppercase mb-1">
                <Wallet className="w-4 h-4" />
                Pembayaran
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">SPP Bulanan</h1>
              <p className="text-slate-400 text-sm mt-1">
                Catat status SPP santri per bulan (Lunas / Belum). Nominal sementara seragam.
              </p>
            </div>
          </div>

          {toast && (
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 ${
                toast.type === 'success'
                  ? 'bg-emerald-950/70 border-emerald-800/80 text-emerald-200'
                  : 'bg-rose-950/70 border-rose-800/80 text-rose-200'
              }`}
            >
              {toast.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              )}
              <p className="text-sm">{toast.text}</p>
            </div>
          )}

          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <p className="text-[11px] text-slate-500 font-semibold">Periode</p>
              <p className="text-lg font-bold text-white mt-1">{formatPeriodeLabel(periode)}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <p className="text-[11px] text-slate-500 font-semibold">Santri (filter)</p>
              <p className="text-lg font-bold text-white mt-1">{rekap.totalSantri}</p>
            </div>
            <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-2xl p-4">
              <p className="text-[11px] text-emerald-400/80 font-semibold">Lunas</p>
              <p className="text-lg font-bold text-emerald-300 mt-1">
                {rekap.lunas} · {formatRupiah(rekap.nominalLunas)}
              </p>
            </div>
            <div className="bg-rose-950/40 border border-rose-800/60 rounded-2xl p-4">
              <p className="text-[11px] text-rose-400/80 font-semibold">Belum</p>
              <p className="text-lg font-bold text-rose-300 mt-1">
                {rekap.belum} · {formatRupiah(rekap.nominalBelum)}
              </p>
            </div>
          </section>

          <form onSubmit={handleSubmit} className="space-y-5">
            <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-400" />
                Pengaturan Sesi SPP
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Bulan</label>
                  <input
                    type="month"
                    required
                    value={periode}
                    onChange={(e) => handlePeriodeChange(e.target.value)}
                    className={`${inputCls} [color-scheme:dark]`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Filter tingkatan
                  </label>
                  <select
                    value={tingkatanFilter}
                    onChange={(e) =>
                      setTingkatanFilter(e.target.value as 'all' | TingkatanKelas)
                    }
                    className={inputCls}
                  >
                    <option value="all">Semua tingkatan</option>
                    {TINGKATAN_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Nominal default (Rp)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      value={nominalDefault}
                      onChange={(e) => setNominalDefault(Number(e.target.value) || 0)}
                      className={inputCls}
                    />
                    <button
                      type="button"
                      onClick={handleSaveNominalDefault}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-lg whitespace-nowrap"
                      title="Simpan nominal default untuk semua bulan"
                    >
                      Simpan
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 flex items-end gap-2">
                  <button
                    type="button"
                    onClick={() => markAll('lunas')}
                    className="flex-1 px-4 py-2 bg-emerald-950/50 hover:bg-emerald-900 border border-emerald-800/60 text-emerald-200 text-xs font-bold rounded-xl"
                  >
                    Semua Lunas
                  </button>
                  <button
                    type="button"
                    onClick={() => markAll('belum')}
                    className="flex-1 px-4 py-2 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/50 text-rose-200 text-xs font-bold rounded-xl"
                  >
                    Semua Belum
                  </button>
                </div>
              </div>
            </section>

            <section className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  Daftar Santri ({filteredSantri.length})
                </h2>
                {loadingSpp && (
                  <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Memuat SPP...
                  </span>
                )}
              </div>

              {filteredSantri.length === 0 ? (
                <p className="text-sm text-slate-500 py-10 text-center">
                  Tidak ada santri pada tingkatan ini.
                </p>
              ) : (
                <div className="divide-y divide-slate-800">
                  {filteredSantri.map((s) => {
                    const entry = draft[s.id];
                    const current = getStatus(s.id);
                    return (
                      <div
                        key={s.id}
                        className="p-4 sm:px-5 grid grid-cols-1 lg:grid-cols-12 gap-3 lg:items-center"
                      >
                        <div className="lg:col-span-4 min-w-0">
                          <p className="text-sm font-bold text-white truncate">
                            {s.nama_lengkap}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-slate-500 font-mono">
                              {s.nis ? `NIS ${s.nis}` : s.kode_unik}
                            </span>
                            <span
                              className={`inline-flex px-1.5 py-0.5 rounded border text-[9px] font-bold ${getTingkatanBadgeClass(
                                s.tingkatan
                              )}`}
                            >
                              {getTingkatanLabel(s.tingkatan)}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1">
                            {formatRupiah(nominalDefault)}
                          </p>
                        </div>

                        <div className="lg:col-span-4">
                          <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                            {STATUS_SPP_OPTIONS.map((opt) => {
                              const active = current === opt.value;
                              return (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() => setStatus(s.id, opt.value)}
                                  title={opt.description}
                                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                                    active
                                      ? `border ${getStatusSppBadgeClass(opt.value)}`
                                      : 'text-slate-400 hover:text-white border border-transparent'
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              );
                            })}
                            {features.whatsapp && (
                              <button
                                type="button"
                                onClick={() => handleKirimWaPengingat(s)}
                                disabled={current === 'lunas'}
                                title={
                                  current === 'lunas'
                                    ? 'Sudah lunas — pengingat tidak diperlukan'
                                    : s.no_wa_wali?.trim()
                                      ? 'Kirim pengingat SPP via WhatsApp ke wali'
                                      : 'Nomor WA wali belum diisi'
                                }
                                className={`py-2 text-xs font-bold rounded-lg transition-all inline-flex items-center justify-center gap-1 ${
                                  current === 'lunas'
                                    ? 'text-slate-600 border border-transparent cursor-not-allowed'
                                    : s.no_wa_wali?.trim()
                                      ? 'bg-sky-950/50 text-sky-300 border border-sky-800/60 hover:bg-sky-900'
                                      : 'text-amber-400/80 border border-amber-800/40 hover:bg-amber-950/40'
                                }`}
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                WA
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="lg:col-span-4">
                          <input
                            value={entry?.catatan ?? ''}
                            onChange={(e) => setCatatan(s.id, e.target.value)}
                            placeholder="Catatan (opsional)"
                            className={inputCls}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pb-8">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white text-sm font-bold rounded-xl inline-flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Simpan SPP
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
