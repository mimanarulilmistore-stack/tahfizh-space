'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getBrowserSupabase } from '@/src/lib/supabase';
import BrandLogo from '@/components/BrandLogo';
import { BRAND_NAME } from '@/src/config/brand';
import { isDemoAccountEmail } from '@/src/config/demo';
import { features } from '@/src/config/features';
import { 
  LayoutDashboard, 
  QrCode, 
  FileText, 
  LogOut, 
  Menu, 
  X,
  BookOpen,
  Layers,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Megaphone,
  ClipboardCheck,
  Wallet,
} from 'lucide-react';

const supabase = getBrowserSupabase();

type NavItem = {
  path: string;
  label: string;
  mobileLabel?: string;
  icon: React.ReactNode;
  enabled: boolean;
};

export default function HeaderAdmin() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [canChangePassword, setCanChangePassword] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const loadUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!cancelled) {
          setCanChangePassword(!isDemoAccountEmail(user?.email));
        }
      } catch {
        if (!cancelled) setCanChangePassword(true);
      }
    };
    void loadUser();
    return () => {
      cancelled = true;
    };
  }, []);

  const navItems: NavItem[] = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
      enabled: true,
    },
    {
      path: '/dashboard/input',
      label: 'Input Setoran',
      icon: <BookOpen className="w-4 h-4 text-emerald-400" />,
      enabled: true,
    },
    {
      path: '/dashboard/input-massal',
      label: 'Input Massal',
      icon: <Layers className="w-4 h-4 text-sky-400" />,
      enabled: features.inputMassal,
    },
    {
      path: '/dashboard/absensi',
      label: 'Absensi',
      icon: <ClipboardCheck className="w-4 h-4 text-emerald-400" />,
      enabled: features.absensi,
    },
    {
      path: '/dashboard/spp',
      label: 'SPP',
      mobileLabel: 'SPP Bulanan',
      icon: <Wallet className="w-4 h-4 text-amber-400" />,
      enabled: features.spp,
    },
    {
      path: '/dashboard/cetak-kartu',
      label: 'Cetak PIN',
      mobileLabel: 'Cetak PIN Wali',
      icon: <QrCode className="w-4 h-4 text-emerald-400" />,
      enabled: features.cetakKartu,
    },
    {
      path: '/dashboard/laporan',
      label: 'Laporan',
      mobileLabel: 'Laporan & Rapor',
      icon: <FileText className="w-4 h-4 text-emerald-400" />,
      enabled: features.laporan,
    },
    {
      path: '/dashboard/pengumuman',
      label: 'Pengumuman',
      icon: <Megaphone className="w-4 h-4 text-amber-400" />,
      enabled: features.pengumuman,
    },
  ];

  const visibleNav = navItems.filter((item) => item.enabled);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.assign('/');
  };

  const openPasswordModal = () => {
    if (!canChangePassword) return;
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError(null);
    setPasswordSuccess(false);
    setPasswordModalOpen(true);
    setIsMobileMenuOpen(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    if (!canChangePassword) {
      setPasswordError('Akun demo tidak dapat mengubah kata sandi.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('Kata sandi baru minimal 8 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Konfirmasi kata sandi tidak sama.');
      return;
    }
    setPasswordLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (isDemoAccountEmail(user?.email)) {
        throw new Error('Akun demo tidak dapat mengubah kata sandi.');
      }
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPasswordSuccess(true);
      setTimeout(() => setPasswordModalOpen(false), 1500);
    } catch (err: unknown) {
      setPasswordError(
        err instanceof Error ? err.message : 'Gagal mengubah kata sandi.'
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  const isActive = (path: string) => {
    if (path === '/dashboard') return pathname === '/dashboard';
    if (path === '/dashboard/input') return pathname === '/dashboard/input';
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  const navButtonClass = (path: string) =>
    `px-3.5 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 ${
      isActive(path)
        ? 'bg-emerald-950/60 border border-emerald-800/80 text-emerald-300'
        : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
    }`;

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* BRAND LOGO */}
          <div 
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <BrandLogo size="sm" tone="onDark" />
            <div>
              <h1 className="text-sm font-bold text-white tracking-wide leading-tight">
                {BRAND_NAME}
              </h1>
              <p className="text-[10px] text-emerald-300 font-mono font-medium">
                Admin Panel
              </p>
            </div>
          </div>

          {/* DESKTOP NAVIGATION */}
          <nav className="hidden md:flex items-center gap-1.5">
            {visibleNav.map((item) => (
              <button
                key={item.path}
                type="button"
                onClick={() => router.push(item.path)}
                className={navButtonClass(item.path)}
              >
                {item.icon}
                {item.label}
              </button>
            ))}

            <div className="h-4 w-[1px] bg-slate-800 mx-2" />

            {canChangePassword ? (
              <button
                onClick={openPasswordModal}
                className="px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-xl transition-all flex items-center gap-1.5"
                title="Ubah kata sandi"
              >
                <KeyRound className="w-4 h-4 text-amber-400" />
                Sandi
              </button>
            ) : null}

            <button
              onClick={handleLogout}
              className="px-3.5 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 rounded-xl transition-all flex items-center gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              Keluar
            </button>
          </nav>

          {/* HAMBURGER BUTTON (MOBILE) */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white focus:outline-none"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* MOBILE MENU DROPDOWN */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900/95 backdrop-blur-lg px-4 pt-3 pb-4 space-y-1.5">
          {visibleNav.map((item) => (
            <button
              key={item.path}
              type="button"
              onClick={() => {
                router.push(item.path);
                setIsMobileMenuOpen(false);
              }}
              className="w-full px-3.5 py-2.5 text-xs font-medium text-slate-300 hover:bg-slate-800 rounded-xl flex items-center gap-2.5"
            >
              {item.icon}
              {item.mobileLabel || item.label}
            </button>
          ))}

          {canChangePassword ? (
            <button
              onClick={openPasswordModal}
              className="w-full px-3.5 py-2.5 text-xs font-medium text-slate-300 hover:bg-slate-800 rounded-xl flex items-center gap-2.5 mt-2 border-t border-slate-800/80 pt-3"
            >
              <KeyRound className="w-4 h-4 text-amber-400" />
              Ubah Kata Sandi
            </button>
          ) : (
            <div className="mt-2 border-t border-slate-800/80 pt-3" />
          )}

          <button
            onClick={handleLogout}
            className="w-full px-3.5 py-2.5 text-xs font-medium text-rose-400 hover:bg-rose-950/30 rounded-xl flex items-center gap-2.5"
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </button>
        </div>
      )}

      {canChangePassword && passwordModalOpen ? (
        <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" />
                Ubah Kata Sandi
              </h3>
              <button
                type="button"
                onClick={() => setPasswordModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {passwordSuccess ? (
              <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-800/60 text-emerald-200 text-xs flex gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Kata sandi berhasil diperbarui.
              </div>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-3">
                {passwordError && (
                  <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-200 text-xs flex gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {passwordError}
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">
                    Kata sandi baru
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    placeholder="Minimal 8 karakter"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">
                    Ulangi kata sandi
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2"
                >
                  {passwordLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : null}
                  Simpan
                </button>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
