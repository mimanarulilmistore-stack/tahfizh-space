'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import HeaderAdmin from '@/components/HeaderAdmin';
import { getBrowserSupabase } from '@/src/lib/supabase';
import {
  ArrowLeft,
  RefreshCw,
  Save,
  Trash2,
  Pencil,
  AlertCircle,
  CheckCircle,
  BookOpen,
  User,
  X,
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
  jenis_setoran: 'ziyadah' | 'murajaah' | string;
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

const emptySetoranForm = {
  jenis_setoran: 'ziyadah' as 'ziyadah' | 'murajaah',
  nama_surah: '',
  juz: 1,
  juz_selesai: false,
  ayat_mulai: '',
  ayat_selesai: '',
  nilai_kelancaran: 'Lancar',
  nilai_tajwid: 'Sangat Baik',
  catatan: '',
  tanggal_setoran: new Date().toISOString().split('T')[0],
};

export default function KelolaSantriPage() {
  const router = useRouter();
  const params = useParams();
  const santriId = String(params?.id || '');

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSetoran, setSavingSetoran] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [namaLengkap, setNamaLengkap] = useState('');
  const [nis, setNis] = useState('');
  const [kodeUnik, setKodeUnik] = useState('');
  const [targetJuz, setTargetJuz] = useState(30);

  const [setoranList, setSetoranList] = useState<SetoranRecord[]>([]);
  const [editSetoranId, setEditSetoranId] = useState<string | null>(null);
  const [setoranForm, setSetoranForm] = useState(emptySetoranForm);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, nama_lengkap, kode_unik, nis, target_juz')
        .eq('id', santriId)
        .eq('role', 'santri')
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profile) {
        showToast('error', 'Data santri tidak ditemukan.');
        router.push('/dashboard');
        return;
      }

      setNamaLengkap(profile.nama_lengkap || '');
      setNis(profile.nis || '');
      setKodeUnik(profile.kode_unik || '');
      setTargetJuz(profile.target_juz || 30);

      const { data: setoran, error: setoranError } = await supabase
        .from('setoran_hafalan')
        .select(
          'id, jenis_setoran, nama_surah, juz, juz_selesai, ayat_mulai, ayat_selesai, nilai_kelancaran, nilai_tajwid, catatan, tanggal_setoran, created_at'
        )
        .eq('santri_id', santriId)
        .order('tanggal_setoran', { ascending: false })
        .order('created_at', { ascending: false });

      if (setoranError) throw setoranError;
      setSetoranList((setoran || []) as SetoranRecord[]);
    } catch (err: any) {
      console.error(err);
      showToast('error', err.message || 'Gagal memuat data santri.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (santriId) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [santriId]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaLengkap.trim()) {
      showToast('error', 'Nama lengkap wajib diisi.');
      return;
    }
    if (!kodeUnik.trim()) {
      showToast('error', 'Kode unik wajib diisi.');
      return;
    }

    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          nama_lengkap: namaLengkap.trim(),
          nis: nis.trim() ? nis.trim() : null,
          kode_unik: kodeUnik.trim().toUpperCase(),
          target_juz: Number(targetJuz) || 30,
        })
        .eq('id', santriId);

      if (error) {
        if (error.code === '23505' || /duplicate|unique/i.test(error.message)) {
          throw new Error('Kode unik sudah dipakai santri lain. Gunakan kode berbeda.');
        }
        throw error;
      }

      showToast('success', 'Profil santri berhasil diperbarui.');
      setKodeUnik(kodeUnik.trim().toUpperCase());
    } catch (err: any) {
      showToast('error', err.message || 'Gagal menyimpan profil.');
    } finally {
      setSavingProfile(false);
    }
  };

  const openEditSetoran = (item: SetoranRecord) => {
    setEditSetoranId(item.id);
    setSetoranForm({
      jenis_setoran: (item.jenis_setoran === 'murajaah' ? 'murajaah' : 'ziyadah') as
        | 'ziyadah'
        | 'murajaah',
      nama_surah: item.nama_surah || '',
      juz: item.juz || 1,
      juz_selesai: Boolean(item.juz_selesai),
      ayat_mulai: item.ayat_mulai != null ? String(item.ayat_mulai) : '',
      ayat_selesai: item.ayat_selesai != null ? String(item.ayat_selesai) : '',
      nilai_kelancaran: item.nilai_kelancaran || 'Lancar',
      nilai_tajwid: item.nilai_tajwid || 'Sangat Baik',
      catatan: item.catatan || '',
      tanggal_setoran:
        item.tanggal_setoran ||
        (item.created_at ? item.created_at.split('T')[0] : new Date().toISOString().split('T')[0]),
    });
  };

  const handleSaveSetoran = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSetoranId) return;
    if (!setoranForm.nama_surah.trim()) {
      showToast('error', 'Nama surah wajib diisi.');
      return;
    }
    if (!setoranForm.juz || setoranForm.juz < 1 || setoranForm.juz > 30) {
      showToast('error', 'Juz harus 1–30.');
      return;
    }

    setSavingSetoran(true);
    try {
      const payload = {
        jenis_setoran: setoranForm.jenis_setoran,
        nama_surah: setoranForm.nama_surah.trim(),
        juz: Number(setoranForm.juz),
        juz_selesai:
          setoranForm.jenis_setoran === 'ziyadah' ? Boolean(setoranForm.juz_selesai) : false,
        ayat_mulai: Number(setoranForm.ayat_mulai) || null,
        ayat_selesai: Number(setoranForm.ayat_selesai) || null,
        nilai_kelancaran: setoranForm.nilai_kelancaran,
        nilai_tajwid: setoranForm.nilai_tajwid,
        catatan: setoranForm.catatan.trim() ? setoranForm.catatan.trim() : null,
        tanggal_setoran: setoranForm.tanggal_setoran || null,
      };

      const { error } = await supabase
        .from('setoran_hafalan')
        .update(payload)
        .eq('id', editSetoranId);

      if (error) throw error;

      showToast('success', 'Setoran berhasil diperbarui.');
      setEditSetoranId(null);
      await loadData();
    } catch (err: any) {
      showToast('error', err.message || 'Gagal menyimpan setoran.');
    } finally {
      setSavingSetoran(false);
    }
  };

  const handleDeleteSetoran = async (id: string, label: string) => {
    if (!confirm(`Hapus setoran "${label}"? Tindakan ini tidak bisa dibatalkan.`)) return;

    try {
      const { error } = await supabase.from('setoran_hafalan').delete().eq('id', id);
      if (error) throw error;
      showToast('success', 'Setoran berhasil dihapus.');
      if (editSetoranId === id) setEditSetoranId(null);
      await loadData();
    } catch (err: any) {
      showToast('error', err.message || 'Gagal menghapus setoran.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-6 py-4 rounded-2xl">
          <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
          <span className="text-sm">Memuat data santri...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <HeaderAdmin />

      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-5">
            <div>
              <button
                onClick={() => router.push('/dashboard')}
                className="text-xs text-emerald-400 hover:underline flex items-center gap-1.5 mb-2 font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Dashboard
              </button>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Pencil className="w-5 h-5 text-emerald-400" />
                Kelola Data Santri
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Edit profil dan koreksi riwayat setoran yang salah input.
              </p>
            </div>
          </div>

          {toast && (
            <div
              className={`fixed top-4 right-4 z-[60] max-w-sm p-4 rounded-xl border flex items-start gap-3 shadow-2xl ${
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

          {/* EDIT PROFIL */}
          <form
            onSubmit={handleSaveProfile}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4"
          >
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-400" />
              Profil Santri
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-slate-300">Nama Lengkap *</label>
                <input
                  value={namaLengkap}
                  onChange={(e) => setNamaLengkap(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">NIS (opsional)</label>
                <input
                  value={nis}
                  onChange={(e) => setNis(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Target Juz</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={targetJuz}
                  onChange={(e) => setTargetJuz(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-slate-300">Kode Unik / PIN *</label>
                <input
                  value={kodeUnik}
                  onChange={(e) => setKodeUnik(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-emerald-400 font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  required
                />
                <p className="text-[11px] text-slate-500">
                  Jika diganti, cetak ulang kartu QR agar wali memakai kode baru.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingProfile}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center gap-2"
              >
                {savingProfile ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Simpan Profil
              </button>
            </div>
          </form>

          {/* RIWAYAT SETORAN */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              Riwayat Setoran ({setoranList.length})
            </h2>

            {setoranList.length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center border border-dashed border-slate-800 rounded-xl">
                Belum ada setoran untuk santri ini.
              </p>
            ) : (
              <div className="overflow-x-auto border border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="px-3 py-3">Tanggal</th>
                      <th className="px-3 py-3">Jenis</th>
                      <th className="px-3 py-3">Juz</th>
                      <th className="px-3 py-3">Surah</th>
                      <th className="px-3 py-3">Nilai</th>
                      <th className="px-3 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {setoranList.map((item) => {
                      const tanggal =
                        item.tanggal_setoran ||
                        (item.created_at
                          ? new Date(item.created_at).toLocaleDateString('id-ID')
                          : '-');
                      const label = `${item.nama_surah || 'Setoran'} Juz ${item.juz ?? '-'}`;
                      return (
                        <tr key={item.id} className="hover:bg-slate-950/40">
                          <td className="px-3 py-2.5 whitespace-nowrap">{tanggal}</td>
                          <td className="px-3 py-2.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                item.jenis_setoran === 'ziyadah'
                                  ? 'bg-blue-950 text-blue-300 border border-blue-800'
                                  : 'bg-amber-950 text-amber-300 border border-amber-800'
                              }`}
                            >
                              {item.jenis_setoran}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 font-mono">
                            {item.juz ?? '-'}
                            {item.juz_selesai ? (
                              <span className="ml-1 text-emerald-400 font-bold">✓</span>
                            ) : null}
                          </td>
                          <td className="px-3 py-2.5">
                            <p className="font-semibold text-white">{item.nama_surah || '-'}</p>
                            <p className="text-[10px] text-slate-500">
                              Ayat {item.ayat_mulai ?? '-'}–{item.ayat_selesai ?? '-'}
                            </p>
                          </td>
                          <td className="px-3 py-2.5 text-[11px]">
                            {item.nilai_kelancaran || '-'} / {item.nilai_tajwid || '-'}
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => openEditSetoran(item)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200"
                                title="Edit setoran"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSetoran(item.id, label)}
                                className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900 border border-rose-800/60 text-rose-400"
                                title="Hapus setoran"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL EDIT SETORAN */}
      {editSetoranId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Pencil className="w-4 h-4 text-emerald-400" />
                Edit Setoran
              </h3>
              <button
                type="button"
                onClick={() => setEditSetoranId(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSetoran} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">Jenis</label>
                  <select
                    value={setoranForm.jenis_setoran}
                    onChange={(e) =>
                      setSetoranForm((f) => ({
                        ...f,
                        jenis_setoran: e.target.value as 'ziyadah' | 'murajaah',
                        juz_selesai:
                          e.target.value === 'murajaah' ? false : f.juz_selesai,
                      }))
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  >
                    <option value="ziyadah">Ziyadah</option>
                    <option value="murajaah">Murajaah</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">Tanggal</label>
                  <input
                    type="date"
                    value={setoranForm.tanggal_setoran}
                    onChange={(e) =>
                      setSetoranForm((f) => ({ ...f, tanggal_setoran: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">Nama Surah *</label>
                <input
                  value={setoranForm.nama_surah}
                  onChange={(e) =>
                    setSetoranForm((f) => ({ ...f, nama_surah: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">Juz *</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={setoranForm.juz}
                    onChange={(e) =>
                      setSetoranForm((f) => ({ ...f, juz: Number(e.target.value) }))
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">Ayat Mulai</label>
                  <input
                    type="number"
                    min={1}
                    value={setoranForm.ayat_mulai}
                    onChange={(e) =>
                      setSetoranForm((f) => ({ ...f, ayat_mulai: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">Ayat Selesai</label>
                  <input
                    type="number"
                    min={1}
                    value={setoranForm.ayat_selesai}
                    onChange={(e) =>
                      setSetoranForm((f) => ({ ...f, ayat_selesai: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
                  />
                </div>
              </div>

              {setoranForm.jenis_setoran === 'ziyadah' && (
                <label className="flex items-start gap-2 p-3 rounded-xl border border-emerald-800/40 bg-emerald-950/20 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={setoranForm.juz_selesai}
                    onChange={(e) =>
                      setSetoranForm((f) => ({ ...f, juz_selesai: e.target.checked }))
                    }
                    className="mt-0.5"
                  />
                  <span className="text-xs text-slate-300">
                    <span className="font-bold text-emerald-300 block">
                      Tandai Juz {setoranForm.juz} selesai
                    </span>
                    Centang jika setoran ini menyelesaikan juz tersebut.
                  </span>
                </label>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">Kelancaran</label>
                  <select
                    value={setoranForm.nilai_kelancaran}
                    onChange={(e) =>
                      setSetoranForm((f) => ({ ...f, nilai_kelancaran: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  >
                    <option value="Sangat Lancar">Sangat Lancar</option>
                    <option value="Lancar">Lancar</option>
                    <option value="Cukup">Cukup</option>
                    <option value="Perlu Ulang">Perlu Ulang</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">Tajwid</label>
                  <select
                    value={setoranForm.nilai_tajwid}
                    onChange={(e) =>
                      setSetoranForm((f) => ({ ...f, nilai_tajwid: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  >
                    <option value="Sangat Baik">Sangat Baik</option>
                    <option value="Baik">Baik</option>
                    <option value="Cukup">Cukup</option>
                    <option value="Perlu Perbaikan">Perlu Perbaikan</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">Catatan</label>
                <textarea
                  rows={2}
                  value={setoranForm.catatan}
                  onChange={(e) =>
                    setSetoranForm((f) => ({ ...f, catatan: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white resize-y"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditSetoranId(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingSetoran}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-2"
                >
                  {savingSetoran ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  Simpan Setoran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
