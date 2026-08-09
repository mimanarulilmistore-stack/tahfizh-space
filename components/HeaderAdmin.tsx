'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getBrowserSupabase } from '@/src/lib/supabase';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  QrCode, 
  FileText, 
  LogOut, 
  Menu, 
  X 
} from 'lucide-react';

const supabase = getBrowserSupabase();

export default function HeaderAdmin() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // Kembali ke halaman depan (2 opsi: ustadz / wali)
    window.location.assign('/');
  };

  const isActive = (path: string) => pathname === path;

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* BRAND LOGO */}
          <div 
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 transition-all">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-wide leading-tight">
                TAHFIZH SPACE
              </h1>
              <p className="text-[10px] text-emerald-400 font-mono font-medium">
                Admin Panel
              </p>
            </div>
          </div>

          {/* DESKTOP NAVIGATION */}
          <nav className="hidden md:flex items-center gap-1.5">
            <button
              onClick={() => router.push('/dashboard')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 ${
                isActive('/dashboard') 
                  ? 'bg-emerald-950/60 border border-emerald-800/80 text-emerald-300' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </button>

            {/* TOMBOL CETAK PIN */}
            <button
              onClick={() => router.push('/dashboard/cetak-kartu')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 ${
                isActive('/dashboard/cetak-kartu') 
                  ? 'bg-emerald-950/60 border border-emerald-800/80 text-emerald-300' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <QrCode className="w-4 h-4 text-emerald-400" />
              Cetak PIN
            </button>

            {/* TOMBOL LAPORAN (PERSIAPAN MODUL 2) */}
            <button
              onClick={() => router.push('/dashboard/laporan')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 ${
                isActive('/dashboard/laporan') 
                  ? 'bg-emerald-950/60 border border-emerald-800/80 text-emerald-300' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              Laporan
            </button>

            <div className="h-4 w-[1px] bg-slate-800 mx-2" />

            {/* LOGOUT */}
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
          <button
            onClick={() => {
              router.push('/dashboard');
              setIsMobileMenuOpen(false);
            }}
            className="w-full px-3.5 py-2.5 text-xs font-medium text-slate-300 hover:bg-slate-800 rounded-xl flex items-center gap-2.5"
          >
            <LayoutDashboard className="w-4 h-4 text-emerald-400" />
            Dashboard
          </button>

          <button
            onClick={() => {
              router.push('/dashboard/cetak-kartu');
              setIsMobileMenuOpen(false);
            }}
            className="w-full px-3.5 py-2.5 text-xs font-medium text-slate-300 hover:bg-slate-800 rounded-xl flex items-center gap-2.5"
          >
            <QrCode className="w-4 h-4 text-emerald-400" />
            Cetak PIN Wali
          </button>

          <button
            onClick={() => {
              router.push('/dashboard/laporan');
              setIsMobileMenuOpen(false);
            }}
            className="w-full px-3.5 py-2.5 text-xs font-medium text-slate-300 hover:bg-slate-800 rounded-xl flex items-center gap-2.5"
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            Laporan & Rapor
          </button>

          <button
            onClick={handleLogout}
            className="w-full px-3.5 py-2.5 text-xs font-medium text-rose-400 hover:bg-rose-950/30 rounded-xl flex items-center gap-2.5 mt-2 border-t border-slate-800/80 pt-3"
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </button>
        </div>
      )}
    </header>
  );
}