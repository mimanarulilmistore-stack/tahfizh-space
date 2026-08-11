'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import HeaderAdmin from '@/components/HeaderAdmin';
import { getBrowserSupabase } from '@/src/lib/supabase';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Pin,
  Megaphone,
  Pencil,
  PlusCircle,
  RefreshCw,
  Save,
  Trash2,
} from 'lucide-react';

const supabase = getBrowserSupabase();

type TingkatInfo = 'info' | 'penting' | 'darurat';

type PengumumanRow = {
  id: string;
  judul: string;
  isi: string;
  tingkat: TingkatInfo;
  pinned: boolean;
  aktif: boolean;
  tampil_mulai: string | null;
  tampil_sampai: string | null;
  created_at: string;
  updated_at: string;
};

const emptyForm = {
  judul: '',
  isi: '',
  tingkat: 'info' as TingkatInfo,
  pinned: false,
  aktif: true,
  tampil_mulai: new Date().toISOString().split('T')[0],
  tampil_sampai: '',
};

export default function PengumumanAdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<PengumumanRow[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

      const { data, error } = await supabase
        .from('admin_pengumuman')
        .select('id, judul, isi, tingkat, pinned, aktif, tampil_mulai, tampil_sampai, created_at, updated_at')
        .order('pinned', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      setItems((data || []) as PengumumanRow[]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal memuat pengumuman.';
      setToast({ type: 'error', text: message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleEdit = (item: PengumumanRow) => {
    setEditingId(item.id);
    setForm({
      judul: item.judul,
      isi: item.isi,
      tingkat: item.tingkat,
      pinned: item.pinned,
      aktif: item.aktif,
      tampil_mulai: item.tampil_mulai || new Date().toISOString().split('T')[0],
      tampil_sampai: item.tampil_sampai || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setToast(null);

    if (!form.judul.trim() || !form.isi.trim()) {
      setToast({ type: 'error', text: 'Judul dan isi pengumuman wajib diisi.' });
      return;
    }
    if (form.tampil_sampai && form.tampil_mulai > form.tampil_sampai) {
      setToast({ type: 'error', text: 'Tanggal selesai tidak boleh sebelum tanggal mulai.' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        judul: form.judul.trim(),
        isi: form.isi.trim(),
        tingkat: form.tingkat,
        pinned: form.pinned,
        aktif: form.aktif,
        tampil_mulai: form.tampil_mulai || null,
        tampil_sampai: form.tampil_sampai || null,
      };

      if (editingId) {
        const { error } = await supabase.from('admin_pengumuman').update(payload).eq('id', editingId);
        if (error) throw error;
        setToast({ type: 'success', text: 'Pengumuman berhasil diperbarui.' });
      } else {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const { error } = await supabase.from('admin_pengumuman').insert([
          {
            ...payload,
            created_by: session?.user.id || null,
          },
        ]);
        if (error) throw error;
        setToast({ type: 'success', text: 'Pengumuman baru berhasil ditambahkan.' });
      }

      resetForm();
      loadData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal menyimpan pengumuman.';
      setToast({ type: 'error', text: message });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (item: PengumumanRow) => {
    try {
      const { error } = await supabase
        .from('admin_pengumuman')
        .update({ aktif: !item.aktif })
        .eq('id', item.id);
      if (error) throw error;
      setToast({
        type: 'success',
        text: item.aktif ? 'Pengumuman dinonaktifkan.' : 'Pengumuman diaktifkan.',
      });
      loadData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal mengubah status pengumuman.';
      setToast({ type: 'error', text: message });
    }
  };

  const handleTogglePin = async (item: PengumumanRow) => {
    try {
      const { error } = await supabase
        .from('admin_pengumuman')
        .update({ pinned: !item.pinned })
        .eq('id', item.id);
      if (error) throw error;
      setToast({
        type: 'success',
        text: item.pinned ? 'Pin pengumuman dilepas.' : 'Pengumuman dipin ke urutan teratas.',
      });
      loadData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal mengubah pin pengumuman.';
      setToast({ type: 'error', text: message });
    }
  };

  const handleDelete = async (item: PengumumanRow) => {
    if (!confirm(`Hapus pengumuman "${item.judul}"?`)) return;
    try {
      const { error } = await supabase.from('admin_pengumuman').delete().eq('id', item.id);
      if (error) throw error;
      setToast({ type: 'success', text: 'Pengumuman berhasil dihapus.' });
      if (editingId === item.id) resetForm();
      loadData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal menghapus pengumuman.';
      setToast({ type: 'error', text: message });
    }
  };

  const badgeClass = (tingkat: TingkatInfo) => {
    if (tingkat === 'darurat') return 'bg-rose-950 text-rose-300 border-rose-800';
    if (tingkat === 'penting') return 'bg-amber-950 text-amber-300 border-amber-800';
    return 'bg-sky-950 text-sky-300 border-sky-800';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <HeaderAdmin />

      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-6">
            <div>
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="text-xs text-emerald-400 hover:underline flex items-center gap-1.5 mb-2 font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Dashboard
              </button>
              <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold tracking-wide uppercase mb-1">
                <Megaphone className="w-4 h-4" />
                Pusat Informasi
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Pengumuman Admin</h1>
              <p className="text-slate-400 text-sm mt-1">
                Kelola pengumuman manual yang akan tampil di Pusat Info Admin dashboard.
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

          <form
            onSubmit={handleSubmit}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                {editingId ? <Pencil className="w-4 h-4 text-amber-400" /> : <PlusCircle className="w-4 h-4 text-emerald-400" />}
                {editingId ? 'Edit Pengumuman' : 'Tambah Pengumuman'}
              </h2>
              {editingId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Batal edit
                </button>
              ) : null}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-slate-300">Judul</label>
                <input
                  value={form.judul}
                  onChange={(e) => setForm((f) => ({ ...f, judul: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  placeholder="Contoh: Ujian tahfizh dimulai pekan depan"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-slate-300">Isi Pengumuman</label>
                <textarea
                  value={form.isi}
                  onChange={(e) => setForm((f) => ({ ...f, isi: e.target.value }))}
                  rows={4}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  placeholder="Tulis informasi untuk semua admin/ustadz..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Tingkat</label>
                <select
                  value={form.tingkat}
                  onChange={(e) => setForm((f) => ({ ...f, tingkat: e.target.value as TingkatInfo }))}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                  <option value="info">Info</option>
                  <option value="penting">Penting</option>
                  <option value="darurat">Darurat</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Status</label>
                <select
                  value={form.aktif ? 'aktif' : 'nonaktif'}
                  onChange={(e) => setForm((f) => ({ ...f, aktif: e.target.value === 'aktif' }))}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Nonaktif</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Prioritas</label>
                <select
                  value={form.pinned ? 'pinned' : 'normal'}
                  onChange={(e) => setForm((f) => ({ ...f, pinned: e.target.value === 'pinned' }))}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                  <option value="normal">Normal</option>
                  <option value="pinned">Pin di urutan teratas</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Tampil Mulai</label>
                <input
                  type="date"
                  value={form.tampil_mulai}
                  onChange={(e) => setForm((f) => ({ ...f, tampil_mulai: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Tampil Sampai</label>
                <input
                  type="date"
                  value={form.tampil_sampai}
                  onChange={(e) => setForm((f) => ({ ...f, tampil_sampai: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white text-xs font-bold rounded-xl inline-flex items-center gap-2"
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editingId ? 'Simpan Perubahan' : 'Tambah Pengumuman'}
              </button>
            </div>
          </form>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-amber-400" />
              Daftar Pengumuman ({items.length})
            </h2>

            {loading ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-400" />
                Memuat pengumuman...
              </div>
            ) : items.length === 0 ? (
              <p className="text-sm text-slate-500 border border-dashed border-slate-800 rounded-xl py-8 text-center">
                Belum ada pengumuman admin.
              </p>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-800 bg-slate-950 p-4 flex flex-col md:flex-row md:items-start md:justify-between gap-4"
                  >
                    <div className="space-y-2 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-bold text-white">{item.judul}</h3>
                        {item.pinned ? (
                          <span className="inline-flex px-2 py-0.5 rounded border text-[10px] font-bold uppercase bg-violet-950 text-violet-300 border-violet-800">
                            pinned
                          </span>
                        ) : null}
                        <span className={`inline-flex px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${badgeClass(item.tingkat)}`}>
                          {item.tingkat}
                        </span>
                        <span
                          className={`inline-flex px-2 py-0.5 rounded border text-[10px] font-bold ${
                            item.aktif
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                              : 'bg-slate-900 text-slate-400 border-slate-700'
                          }`}
                        >
                          {item.aktif ? 'aktif' : 'nonaktif'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-300 whitespace-pre-wrap">{item.isi}</p>
                      <p className="text-[11px] text-slate-500">
                        Tampil: {item.tampil_mulai || '-'} {item.tampil_sampai ? `s/d ${item.tampil_sampai}` : '(tanpa batas akhir)'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleTogglePin(item)}
                        className="px-2.5 py-1.5 bg-violet-950/40 hover:bg-violet-900 border border-violet-800/60 text-violet-300 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1"
                      >
                        <Pin className="w-3.5 h-3.5" />
                        {item.pinned ? 'Lepas Pin' : 'Pin'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggle(item)}
                        className="px-2.5 py-1.5 bg-emerald-950/30 hover:bg-emerald-900/40 border border-emerald-800/60 text-emerald-300 rounded-lg text-[11px] font-semibold"
                      >
                        {item.aktif ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEdit(item)}
                        className="px-2.5 py-1.5 bg-sky-950/40 hover:bg-sky-900 border border-sky-800/60 text-sky-300 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item)}
                        className="p-1.5 bg-rose-950/40 hover:bg-rose-900 border border-rose-800/60 text-rose-400 rounded-lg"
                        title="Hapus pengumuman"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
