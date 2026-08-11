'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import HeaderAdmin from '@/components/HeaderAdmin';
import { getBrowserSupabase } from '@/src/lib/supabase';
import {
  TINGKATAN_OPTIONS,
  type TingkatanKelas,
  getTingkatanLabel,
  normalizeTingkatan,
} from '@/src/utils/tingkatan';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Layers,
  Plus,
  RefreshCw,
  Save,
  Trash2,
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

type RowDraft = {
  key: string;
  santriId: string;
  namaSurah: string;
  juz: number;
  ayatMulai: string;
  ayatSelesai: string;
  juzSelesai: boolean;
  catatan: string;
};

const NILAI_KELANCARAN = ['Lancar', 'Cukup Lancar', 'Kurang Lancar'];
const NILAI_TAJWID = ['Sangat Baik', 'Baik', 'Cukup', 'Perlu Perbaikan'];

function newRow(partial?: Partial<RowDraft>): RowDraft {
  return {
    key:
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    santriId: '',
    namaSurah: '',
    juz: 1,
    ayatMulai: '',
    ayatSelesai: '',
    juzSelesai: false,
    catatan: '',
    ...partial,
  };
}

export default function InputMassalPage() {
  const router = useRouter();
  const [loadingSession, setLoadingSession] = useState(true);
  const [ustadzId, setUstadzId] = useState<string | null>(null);
  const [santriList, setSantriList] = useState<SantriOption[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [tanggalSetoran, setTanggalSetoran] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [jenisSetoran, setJenisSetoran] = useState<'ziyadah' | 'murajaah'>('ziyadah');
  const [nilaiKelancaran, setNilaiKelancaran] = useState('Lancar');
  const [nilaiTajwid, setNilaiTajwid] = useState('Sangat Baik');
  const [tingkatanFilter, setTingkatanFilter] = useState<'all' | TingkatanKelas>('all');

  const [rows, setRows] = useState<RowDraft[]>([newRow(), newRow(), newRow()]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSelected, setPickerSelected] = useState<Record<string, boolean>>({});
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
        console.error(err);
      } finally {
        setLoadingSession(false);
      }
    };
    init();
  }, [router]);

  const filteredSantri = useMemo(() => {
    if (tingkatanFilter === 'all') return santriList;
    return santriList.filter(
      (s) => normalizeTingkatan(s.tingkatan) === tingkatanFilter
    );
  }, [santriList, tingkatanFilter]);

  const usedSantriIds = useMemo(
    () => new Set(rows.map((r) => r.santriId).filter(Boolean)),
    [rows]
  );

  const updateRow = (key: string, patch: Partial<RowDraft>) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };

  const removeRow = (key: string) => {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.key !== key)));
  };

  const addEmptyRows = (n = 1) => {
    setRows((prev) => [...prev, ...Array.from({ length: n }, () => newRow())]);
  };

  const openPicker = () => {
    const initial: Record<string, boolean> = {};
    filteredSantri.forEach((s) => {
      if (!usedSantriIds.has(s.id)) initial[s.id] = false;
    });
    setPickerSelected(initial);
    setPickerOpen(true);
  };

  const applyPicker = () => {
    const ids = Object.entries(pickerSelected)
      .filter(([, on]) => on)
      .map(([id]) => id);
    if (ids.length === 0) {
      setPickerOpen(false);
      return;
    }
    setRows((prev) => {
      const emptySlots = prev.filter((r) => !r.santriId);
      const next = [...prev];
      let slotIdx = 0;
      for (const id of ids) {
        if (slotIdx < emptySlots.length) {
          const key = emptySlots[slotIdx].key;
          const i = next.findIndex((r) => r.key === key);
          if (i >= 0) next[i] = { ...next[i], santriId: id };
          slotIdx += 1;
        } else {
          next.push(newRow({ santriId: id }));
        }
      }
      return next;
    });
    setPickerOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setToast(null);

    if (!ustadzId) {
      setToast({ type: 'error', text: 'Sesi ustadz tidak valid. Silakan login ulang.' });
      return;
    }

    const ready = rows.filter((r) => r.santriId || r.namaSurah.trim() || r.ayatMulai);
    if (ready.length === 0) {
      setToast({ type: 'error', text: 'Belum ada baris setoran yang diisi.' });
      return;
    }

    const payloads: Array<Record<string, unknown>> = [];
    for (let i = 0; i < ready.length; i++) {
      const r = ready[i];
      const label = `Baris ${i + 1}`;
      if (!r.santriId) {
        setToast({ type: 'error', text: `${label}: pilih santri.` });
        return;
      }
      if (!r.namaSurah.trim()) {
        setToast({ type: 'error', text: `${label}: nama surah wajib.` });
        return;
      }
      if (!r.ayatMulai || !r.ayatSelesai) {
        setToast({ type: 'error', text: `${label}: ayat mulai & selesai wajib.` });
        return;
      }
      if (!r.juz || r.juz < 1 || r.juz > 30) {
        setToast({ type: 'error', text: `${label}: juz harus 1–30.` });
        return;
      }
      payloads.push({
        santri_id: r.santriId,
        ustadz_id: ustadzId,
        jenis_setoran: jenisSetoran,
        nama_surah: r.namaSurah.trim(),
        juz: Number(r.juz),
        juz_selesai: jenisSetoran === 'ziyadah' ? r.juzSelesai : false,
        ayat_mulai: Number(r.ayatMulai),
        ayat_selesai: Number(r.ayatSelesai),
        tanggal_setoran: tanggalSetoran,
        nilai_kelancaran: nilaiKelancaran,
        nilai_tajwid: nilaiTajwid,
        catatan: r.catatan.trim() ? r.catatan.trim() : null,
      });
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('setoran_hafalan').insert(payloads);
      if (error) throw error;

      setToast({
        type: 'success',
        text: `${payloads.length} setoran berhasil disimpan untuk sesi ${tanggalSetoran}.`,
      });
      setRows([newRow(), newRow(), newRow()]);
      setTimeout(() => setToast(null), 6000);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Gagal menyimpan setoran massal.';
      setToast({ type: 'error', text: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingSession) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-6 py-4 rounded-2xl">
          <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
          <span className="text-sm text-slate-300">Memuat sesi...</span>
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
                onClick={() => router.push('/dashboard/input')}
                className="text-xs text-emerald-400 hover:underline flex items-center gap-1.5 mb-2 font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Input Tunggal
              </button>
              <div className="flex items-center gap-2 text-sky-400 text-sm font-semibold tracking-wide uppercase mb-1">
                <Layers className="w-4 h-4" />
                Sesi Hafalan
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Input Massal</h1>
              <p className="text-slate-400 text-sm mt-1">
                Catat setoran beberapa santri dalam satu sesi. Tanggal, jenis, dan nilai
                dipakai bersama.
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

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Shared session */}
            <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-400" />
                Pengaturan Sesi (berlaku untuk semua baris)
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={tanggalSetoran}
                    onChange={(e) => setTanggalSetoran(e.target.value)}
                    className={inputCls}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Jenis</label>
                  <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setJenisSetoran('ziyadah')}
                      className={`py-2 text-xs font-bold rounded-lg ${
                        jenisSetoran === 'ziyadah'
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Ziyadah
                    </button>
                    <button
                      type="button"
                      onClick={() => setJenisSetoran('murajaah')}
                      className={`py-2 text-xs font-bold rounded-lg ${
                        jenisSetoran === 'murajaah'
                          ? 'bg-sky-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Murajaah
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Kelancaran</label>
                  <select
                    value={nilaiKelancaran}
                    onChange={(e) => setNilaiKelancaran(e.target.value)}
                    className={inputCls}
                  >
                    {NILAI_KELANCARAN.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Tajwid</label>
                  <select
                    value={nilaiTajwid}
                    onChange={(e) => setNilaiTajwid(e.target.value)}
                    className={inputCls}
                  >
                    {NILAI_TAJWID.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-end gap-3 pt-1">
                <div className="space-y-1.5 flex-1 max-w-xs">
                  <label className="text-xs font-semibold text-slate-300">
                    Filter daftar santri
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
                <button
                  type="button"
                  onClick={openPicker}
                  className="px-4 py-2.5 bg-sky-950/50 hover:bg-sky-900 border border-sky-800/60 text-sky-200 text-xs font-bold rounded-xl"
                >
                  + Pilih beberapa santri
                </button>
              </div>
            </section>

            {/* Rows */}
            <section className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h2 className="text-sm font-bold text-white">
                  Baris Setoran ({rows.length})
                </h2>
                <button
                  type="button"
                  onClick={() => addEmptyRows(1)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambah baris
                </button>
              </div>

              <div className="divide-y divide-slate-800">
                {rows.map((row, idx) => (
                  <div key={row.key} className="p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono text-slate-500">#{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeRow(row.key)}
                        disabled={rows.length <= 1}
                        className="p-1.5 text-rose-400/80 hover:text-rose-300 disabled:opacity-30"
                        title="Hapus baris"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                      <div className="sm:col-span-2 lg:col-span-2 space-y-1">
                        <label className="text-[11px] text-slate-400">Santri *</label>
                        <select
                          value={row.santriId}
                          onChange={(e) => updateRow(row.key, { santriId: e.target.value })}
                          className={inputCls}
                        >
                          <option value="">— Pilih —</option>
                          {filteredSantri.map((s) => (
                            <option
                              key={s.id}
                              value={s.id}
                              disabled={usedSantriIds.has(s.id) && s.id !== row.santriId}
                            >
                              {s.nama_lengkap}
                              {s.nis ? ` (${s.nis})` : ''} ·{' '}
                              {getTingkatanLabel(s.tingkatan)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] text-slate-400">Surah *</label>
                        <input
                          value={row.namaSurah}
                          onChange={(e) => updateRow(row.key, { namaSurah: e.target.value })}
                          placeholder="Al-Baqarah"
                          className={inputCls}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] text-slate-400">Juz *</label>
                        <input
                          type="number"
                          min={1}
                          max={30}
                          value={row.juz}
                          onChange={(e) =>
                            updateRow(row.key, { juz: Number(e.target.value) || 1 })
                          }
                          className={inputCls}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] text-slate-400">Ayat *</label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={1}
                            value={row.ayatMulai}
                            onChange={(e) =>
                              updateRow(row.key, { ayatMulai: e.target.value })
                            }
                            placeholder="1"
                            className={inputCls}
                          />
                          <span className="text-slate-600 text-xs">–</span>
                          <input
                            type="number"
                            min={1}
                            value={row.ayatSelesai}
                            onChange={(e) =>
                              updateRow(row.key, { ayatSelesai: e.target.value })
                            }
                            placeholder="5"
                            className={inputCls}
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] text-slate-400">Catatan</label>
                        <input
                          value={row.catatan}
                          onChange={(e) => updateRow(row.key, { catatan: e.target.value })}
                          placeholder="Opsional"
                          className={inputCls}
                        />
                      </div>
                    </div>

                    {jenisSetoran === 'ziyadah' && (
                      <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={row.juzSelesai}
                          onChange={(e) =>
                            updateRow(row.key, { juzSelesai: e.target.checked })
                          }
                          className="rounded border-slate-700 bg-slate-950 text-emerald-500"
                        />
                        Tandai juz selesai
                      </label>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pb-8">
              <button
                type="button"
                onClick={() => addEmptyRows(3)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl"
              >
                +3 baris kosong
              </button>
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
                Simpan Semua Setoran
              </button>
            </div>
          </form>
        </div>
      </div>

      {pickerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Pilih Santri</h3>
              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Tutup
              </button>
            </div>
            <div className="overflow-y-auto p-3 space-y-1 flex-1">
              {filteredSantri.filter((s) => !usedSantriIds.has(s.id)).length === 0 ? (
                <p className="text-xs text-slate-500 p-3 text-center">
                  Semua santri di filter ini sudah ada di baris, atau daftar kosong.
                </p>
              ) : (
                filteredSantri
                  .filter((s) => !usedSantriIds.has(s.id))
                  .map((s) => (
                    <label
                      key={s.id}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-800/80 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(pickerSelected[s.id])}
                        onChange={(e) =>
                          setPickerSelected((prev) => ({
                            ...prev,
                            [s.id]: e.target.checked,
                          }))
                        }
                        className="rounded border-slate-700 bg-slate-950 text-emerald-500"
                      />
                      <span className="text-sm text-slate-200">{s.nama_lengkap}</span>
                      <span className="text-[10px] text-slate-500 ml-auto">
                        {getTingkatanLabel(s.tingkatan)}
                      </span>
                    </label>
                  ))
              )}
            </div>
            <div className="p-4 border-t border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={applyPicker}
                className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl"
              >
                Tambahkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
