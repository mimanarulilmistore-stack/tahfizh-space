'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserSupabase } from '@/src/lib/supabase';
import {
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Lock,
  RefreshCw,
} from 'lucide-react';
import { isDemoAccountEmail } from '@/src/config/demo';

const supabase = getBrowserSupabase();

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [blockedDemo, setBlockedDemo] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        // Tangani token di hash (fallback non-PKCE)
        if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
          await new Promise((r) => setTimeout(r, 400));
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          router.replace('/login?error=reset_session');
          return;
        }

        if (isDemoAccountEmail(session.user?.email)) {
          setBlockedDemo(true);
        }
      } catch {
        router.replace('/login?error=reset_session');
        return;
      } finally {
        setChecking(false);
      }
    };

    init();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (blockedDemo) {
      setError('Akun demo tidak dapat mengubah kata sandi.');
      return;
    }
    if (password.length < 8) {
      setError('Kata sandi baru minimal 8 karakter.');
      return;
    }
    if (password !== confirm) {
      setError('Konfirmasi kata sandi tidak sama.');
      return;
    }

    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (isDemoAccountEmail(user?.email)) {
        throw new Error('Akun demo tidak dapat mengubah kata sandi.');
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });
      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(() => {
        window.location.assign('/dashboard');
      }, 1500);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Gagal memperbarui kata sandi.';
      setError(message);
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-6 py-4 rounded-2xl">
          <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
          <span className="text-sm text-slate-300">Memverifikasi tautan reset...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wide">
            <KeyRound className="w-4 h-4" />
            Reset Kata Sandi
          </div>
          <h1 className="text-xl font-bold text-white">Buat kata sandi baru</h1>
          <p className="text-xs text-slate-400">
            Setelah disimpan, Anda akan diarahkan ke dashboard.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-800/80 text-rose-200 text-xs flex gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {blockedDemo ? (
          <div className="p-4 rounded-xl bg-amber-950/50 border border-amber-800/60 text-amber-100 text-sm space-y-3">
            <p>
              Akun demo tidak dapat mengubah kata sandi. Gunakan kata sandi yang
              sudah diberikan oleh pengelola.
            </p>
            <button
              type="button"
              onClick={() => window.location.assign('/dashboard')}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl"
            >
              Kembali ke Dashboard
            </button>
          </div>
        ) : success ? (
          <div className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-800/80 text-emerald-200 text-sm flex gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            Kata sandi berhasil diperbarui. Mengalihkan...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Kata sandi baru</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 8 karakter"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Ulangi kata sandi</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Ketik ulang"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan Kata Sandi Baru'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
