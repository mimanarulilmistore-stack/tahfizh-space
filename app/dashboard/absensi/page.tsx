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
  STATUS_ABSENSI_OPTIONS,
  type StatusAbsensi,
  getStatusAbsensiBadgeClass,
  hitungRekapAbsensi,
  normalizeStatusAbsensi,
} from '@/src/utils/absensi';
import {
  AlertCircle,
  ArrowLeft,
  CalendarCheck,
  CheckCircle,
  ClipboardCheck,
  RefreshCw,
  Save,
  Users,
} from 'lucide-react';

const supabase = getBrowserSupabase();

type SantriOption = {
  id: string;
  nama_lengkap: string;
  kode_unik: string;
  nis: string | null;
  tingkatan: string | null;
};

type AbsensiRow = {
  santri_id: string;
  status: string;
  catatan: string | null;
};

type DraftEntry = {
  status: StatusAbsensi;
  catatan: string;
};

function todayKey() {
  return new Date().toISOString().split('T')[0];
}

/** Ambil pesan error yang bisa dibaca manusia (termasuk error Supabase). */
function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  if (err && typeof err === 'object' && 'message' in err) {
    const msg = String((err as { message?: unknown }).message || '').trim();
    if (msg) return msg;
  }
  return fallback;
}

/** Deteksi tabel absensi belum ada / belum dijalankan SQL-nya. */
function isMissingAbsensiTable(err: unknown): boolean {
  const code =
    err && typeof err === 'object' && 'code' in err
      ? String((err as { code?: unknown }).code || '')
      : '';
  const message = getErrorMessage(err, '').toLowerCase();
  return (
    code === '42P01' ||
    code === 'PGRST205' ||
    (/absensi_santri/.test(message) &&
      /does not exist|not find|could not find|schema cache/i.test(message))
  );
}

function pesanErrorAbsensi(err: unknown, mode: 'muat' | 'simpan'): string {
  if (isMissingAbsensiTable(err)) {
    return 'Tabel absensi belum siap di database. Buka Supabase → SQL Editor, jalankan file supabase/fix-absensi.sql, lalu muat ulang halaman ini.';
  }
  const detail = getErrorMessage(err, '');
  if (mode === 'muat') {
    return detail
      ? `Gagal memuat data absensi: ${detail}`
      : 'Gagal memuat data absensi tanggal ini.';
  }
  return detail || 'Gagal menyimpan absensi.';
}

export default function AbsensiPage() {
  const router = useRouter();
  const [loadingSession, setLoadingSession] = useState(true);
  const [loadingAbsensi, setLoadingAbsensi] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ustadzId, setUstadzId] = useState<string | null>(null);

  const [santriList, setSantriList] = useState<SantriOption[]>([]);
  const [tanggal, setTanggal] = useState(todayKey());
  const [tingkatanFilter, setTingkatanFilter] = useState<'all' | TingkatanKelas>('all');
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
          .select('id, nama_lengkap, kode_unik, nis, tingkatan')
          .eq('role', 'santri')
          .order('nama_lengkap', { ascending: true });

        if (error) throw error;
        setSantriList((data || []) as SantriOption[]);
      } catch (err) {
        console.error('Init absensi error:', err);
        setToast({ type: 'error', text: 'Gagal memuat daftar santri.' });
      } finally {
        setLoadingSession(false);
      }
    };
    init();
  }, [router]);

  // Muat absensi tersimpan untuk tanggal terpilih, lalu prefill draft.
  // Catatan: query di-await lebih dulu (tanpa setState sinkron) agar aman
  // dipanggil dari useEffect tanpa memicu cascading render.
  const loadAbsensi = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('absensi_santri')
        .select('santri_id, status, catatan')
        .eq('tanggal', tanggal);

      if (error) throw error;

      const next: Record<string, DraftEntry> = {};
      (data || []).forEach((row: AbsensiRow) => {
        const status = normalizeStatusAbsensi(row.status);
        if (!status) return;
        next[row.santri_id] = { status, catatan: row.catatan || '' };
      });
      setDraft(next);
    } catch (err) {
      console.error('Load absensi error:', err);
      setToast({ type: 'error', text: pesanErrorAbsensi(err, 'muat') });
    } finally {
      setLoadingAbsensi(false);
    }
  }, [tanggal]);

  const handleTanggalChange = (value: string) => {
    setLoadingAbsensi(true);
    setTanggal(value);
  };

  useEffect(() => {
    if (loadingSession) return;
    const run = async () => {
      await loadAbsensi();
    };
    run();
  }, [loadingSession, loadAbsensi]);

  const filteredSantri = useMemo(() => {
    if (tingkatanFilter === 'all') return santriList;
    return santriList.filter(
      (s) => normalizeTingkatan(s.tingkatan) === tingkatanFilter
    );
  }, [santriList, tingkatanFilter]);

  const setStatus = (santriId: string, status: StatusAbsensi) => {
    setDraft((prev) => ({
      ...prev,
      [santriId]: { status, catatan: prev[santriId]?.catatan ?? '' },
    }));
  };

  const setCatatan = (santriId: string, catatan: string) => {
    setDraft((prev) => {
      const current = prev[santriId];
      if (!current) return prev;
      return { ...prev, [santriId]: { ...current, catatan } };
    });
  };

  const markAllHadir = () => {
    setDraft((prev) => {
      const next = { ...prev };
      filteredSantri.forEach((s) => {
        next[s.id] = { status: 'hadir', catatan: next[s.id]?.catatan ?? '' };
      });
      return next;
    });
  };

  const clearFiltered = () => {
    setDraft((prev) => {
      const next = { ...prev };
      filteredSantri.forEach((s) => {
        delete next[s.id];
      });
      return next;
    });
  };

  // Rekap kehadiran per tingkatan untuk tanggal terpilih.
  const rekapPerTingkatan = useMemo(() => {
    return TINGKATAN_OPTIONS.map((opt) => {
      const anggota = santriList.filter(
        (s) => normalizeTingkatan(s.tingkatan) === opt.value
      );
      const rekap = hitungRekapAbsensi(
        anggota.map((s) => draft[s.id]?.status ?? null)
      );
      return { tingkatan: opt, rekap };
    });
  }, [santriList, draft]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setToast(null);

    if (!ustadzId) {
      setToast({ type: 'error', text: 'Sesi ustadz tidak valid. Silakan login ulang.' });
      return;
    }

    const payloads = Object.entries(draft).map(([santriId, entry]) => ({
      santri_id: santriId,
      tanggal,
      status: entry.status,
      catatan: entry.catatan.trim() ? entry.catatan.trim() : null,
      created_by: ustadzId,
    }));

    if (payloads.length === 0) {
      setToast({ type: 'error', text: 'Belum ada santri yang ditandai kehadirannya.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('absensi_santri')
        .upsert(payloads, { onConflict: 'santri_id,tanggal' });
      if (error) throw error;

      setToast({
        type: 'success',
        text: `Absensi ${payloads.length} santri tersimpan untuk tanggal ${tanggal}.`,
      });
      setLoadingAbsensi(true);
      loadAbsensi();
      setTimeout(() => setToast(null), 6000);
    } catch (err: unknown) {
      console.error('Simpan absensi error:', err);
      setToast({ type: 'error', text: pesanErrorAbsensi(err, 'simpan') });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingSession) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-6 py-4 rounded-2xl shadow-xl">
          <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
          <span className="text-sm font-medium text-slate-300">Memuat Modul Absensi...</span>
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
          {/* HEADER */}
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
                <ClipboardCheck className="w-4 h-4" />
                Kehadiran Santri
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Absensi</h1>
              <p className="text-slate-400 text-sm mt-1">
                Tandai kehadiran santri per tanggal dan pantau rekap kehadiran.
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

          {/* REKAP PER TINGKATAN */}
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {rekapPerTingkatan.map(({ tingkatan: opt, rekap }) => (
              <div
                key={opt.value}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded border text-[10px] font-bold ${getTingkatanBadgeClass(
                      opt.value
                    )}`}
                  >
                    {opt.label}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {rekap.terisi}/{rekap.total} terisi
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 text-center">
                  {STATUS_ABSENSI_OPTIONS.map((s) => (
                    <div
                      key={s.value}
                      className={`rounded-lg border py-1.5 ${getStatusAbsensiBadgeClass(s.value)}`}
                      title={s.label}
                    >
                      <p className="text-base font-extrabold leading-none">{rekap[s.value]}</p>
                      <p className="text-[9px] font-semibold mt-1 opacity-80">{s.short}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* PENGATURAN SESI */}
            <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-emerald-400" />
                Pengaturan Sesi Absensi
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={tanggal}
                    onChange={(e) => handleTanggalChange(e.target.value)}
                    className={inputCls}
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

                <div className="space-y-1.5 sm:col-span-2 lg:col-span-2 flex items-end gap-2">
                  <button
                    type="button"
                    onClick={markAllHadir}
                    className="flex-1 px-4 py-2 bg-emerald-950/50 hover:bg-emerald-900 border border-emerald-800/60 text-emerald-200 text-xs font-bold rounded-xl"
                  >
                    Tandai semua Hadir
                  </button>
                  <button
                    type="button"
                    onClick={clearFiltered}
                    className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl"
                  >
                    Kosongkan
                  </button>
                </div>
              </div>
            </section>

            {/* DAFTAR SANTRI */}
            <section className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  Daftar Santri ({filteredSantri.length})
                </h2>
                {loadingAbsensi && (
                  <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Memuat absensi...
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
                    const current = entry?.status ?? null;
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
                        </div>

                        <div className="lg:col-span-5">
                          <div className="grid grid-cols-4 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                            {STATUS_ABSENSI_OPTIONS.map((opt) => {
                              const active = current === opt.value;
                              return (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() => setStatus(s.id, opt.value)}
                                  title={opt.description}
                                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                                    active
                                      ? `border ${getStatusAbsensiBadgeClass(opt.value)}`
                                      : 'text-slate-400 hover:text-white border border-transparent'
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="lg:col-span-3">
                          <input
                            value={entry?.catatan ?? ''}
                            onChange={(e) => setCatatan(s.id, e.target.value)}
                            disabled={!entry}
                            placeholder={entry ? 'Catatan (opsional)' : 'Pilih status dulu'}
                            className={`${inputCls} disabled:opacity-40`}
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
                Simpan Absensi
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
