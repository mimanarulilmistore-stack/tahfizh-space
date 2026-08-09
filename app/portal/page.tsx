'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Hash, ArrowRight, BookOpen, AlertCircle, RefreshCw } from 'lucide-react';

/**
 * Portal wali: hanya input PIN → redirect ke /santri/{kode}.
 * Tidak menampilkan daftar santri lain.
 */
export default function PortalPinPage() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = pin.trim().toUpperCase();
    if (!clean) {
      setError('Masukkan kode unik / PIN yang tertera di kartu anak Anda.');
      return;
    }

    setLoading(true);
    setError(null);
    // Langsung ke halaman santri bersangkutan — tanpa daftar
    router.push(`/santri/${encodeURIComponent(clean)}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 text-emerald-400 font-bold text-lg">
            <BookOpen className="w-5 h-5" />
            TahfizhSpace
          </div>
          <h1 className="text-2xl font-extrabold text-white">Portal Wali Santri</h1>
          <p className="text-sm text-slate-400">
            Masukkan PIN dari kartu anak Anda. Anda hanya akan melihat data anak tersebut.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-200 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Kode Unik / PIN Anak</label>
              <div className="relative">
                <Hash className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Contoh: SNT-K7M2P9QX"
                  autoComplete="off"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono uppercase tracking-wider placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Membuka...
                </>
              ) : (
                <>
                  Lihat Progres Anak
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-500">
          Ustadz?{' '}
          <Link href="/login" className="text-emerald-400 hover:underline">
            Masuk ke dashboard
          </Link>
        </p>
      </div>
    </div>
  );
}
