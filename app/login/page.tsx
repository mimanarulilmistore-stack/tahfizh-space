'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getBrowserSupabase } from '@/src/lib/supabase';
import { 
  Lock, 
  Mail, 
  ArrowRight, 
  AlertCircle, 
  RefreshCw, 
  KeyRound, 
  X, 
  CheckCircle2,
  Send
} from 'lucide-react';
import { Suspense } from 'react';
import BrandLogo from '@/components/BrandLogo';
import { BRAND_NAME } from '@/src/config/brand';

const supabase = getBrowserSupabase();

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  useEffect(() => {
    const err = searchParams.get('error');
    if (err === 'reset_link' || err === 'reset_session') {
      setErrorMessage(
        'Tautan reset tidak valid atau sudah kedaluwarsa. Silakan minta email reset baru.'
      );
    } else if (err === 'config') {
      setErrorMessage('Konfigurasi autentikasi belum lengkap. Hubungi administrator.');
    }
  }, [searchParams]);

  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          router.push('/dashboard');
        }
      } catch (err) {
        console.error('Session Check Error:', err);
      } finally {
        setCheckingSession(false);
      }
    };

    checkExistingSession();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Mohon isi alamat email dan kata sandi Anda.');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Email atau kata sandi yang Anda masukkan salah.');
        }
        throw error;
      }

      if (!data.session) {
        throw new Error('Login berhasil tapi sesi tidak terbentuk. Coba muat ulang halaman.');
      }

      window.location.assign('/dashboard');
      return;
    } catch (err: unknown) {
      console.error('Login Error:', err);
      const message =
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan saat masuk. Silakan coba lagi.';
      setErrorMessage(message);
      setLoading(false);
    }
  };

  const openForgot = () => {
    setResetEmail(email.trim());
    setResetSuccess(false);
    setResetError(null);
    setIsForgotPasswordOpen(true);
  };

  const handleSendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetSuccess(false);

    const target = resetEmail.trim();
    if (!target) {
      setResetError('Masukkan email akun ustadz Anda.');
      return;
    }

    setResetLoading(true);
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const { error } = await supabase.auth.resetPasswordForEmail(target, {
        redirectTo: `${origin}/auth/callback?next=/auth/update-password`,
      });
      if (error) throw error;
      setResetSuccess(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Gagal mengirim email reset. Coba lagi nanti.';
      setResetError(message);
    } finally {
      setResetLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-6 py-4 rounded-2xl shadow-xl">
          <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
          <span className="text-sm font-medium text-slate-300">Memeriksa Sesi Autentikasi...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 font-sans">
      
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md space-y-6">
        
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <BrandLogo size="lg" tone="onDark" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {BRAND_NAME}
          </h1>
          <p className="text-xs sm:text-sm text-emerald-400 font-semibold">
            Portal Pengampu · Mutaba&apos;ah Santri
          </p>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xs mx-auto">
            Masuk dengan akun Ustadz / Pengelola untuk mengelola pencatatan hafalan.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          
          {errorMessage && (
            <div className="p-4 bg-rose-950/70 border border-rose-800/80 rounded-xl flex items-start gap-3 text-rose-200 text-xs animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Alamat Email Ustadz
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ustadz@pesantren.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 block">
                  Kata Sandi
                </label>
                <button
                  type="button"
                  onClick={openForgot}
                  className="text-[11px] text-emerald-400 hover:underline font-medium"
                >
                  Lupa password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-950 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

          </form>

          <div className="border-t border-slate-800/80 pt-4 text-center">
            <p className="text-[11px] text-slate-500">
              Belum memiliki akun Ustadz? Hubungi <span className="text-slate-300 font-medium">Administrator Pesantren</span> untuk pendaftaran.
            </p>
          </div>

        </div>

      </div>

      {isForgotPasswordOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-emerald-400" />
                Reset Kata Sandi
              </h3>
              <button
                type="button"
                onClick={() => setIsForgotPasswordOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {resetSuccess ? (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-800/60 text-emerald-200 text-xs flex gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Jika email <strong className="font-semibold">{resetEmail}</strong> terdaftar,
                    tautan reset telah dikirim. Periksa kotak masuk / spam.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsForgotPasswordOpen(false)}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs"
                >
                  Tutup
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendReset} className="space-y-3">
                <p className="text-xs text-slate-400">
                  Masukkan email akun ustadz. Kami kirim tautan untuk membuat kata sandi baru
                  (berlaku terbatas).
                </p>
                {resetError && (
                  <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-200 text-xs flex gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {resetError}
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Email</label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="ustadz@pesantren.com"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2"
                >
                  {resetLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Kirim Tautan Reset
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-300 text-sm">
          Memuat...
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
