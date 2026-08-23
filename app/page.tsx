import Link from 'next/link';
import BrandLogo from '@/components/BrandLogo';
import { BRAND_NAME, BRAND_TAGLINE } from '@/src/config/brand';
import { UserCheck, ShieldCheck, Award, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col justify-between">
      {/* Header / Navbar */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center">
          <div className="flex items-center gap-2.5 font-bold text-xl text-emerald-700 dark:text-emerald-400">
            <BrandLogo size="sm" tone="onLight" />
            <span className="text-base sm:text-lg text-slate-900 dark:text-slate-100">{BRAND_NAME}</span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-16 max-w-4xl mx-auto">
        <div className="mb-6">
          <BrandLogo size="lg" layout="stacked" tone="onLight" />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold mb-6 border border-emerald-200 dark:border-emerald-800">
          <ShieldCheck className="w-4 h-4" />
          <span>Platform Mutaba&apos;ah &amp; Setoran Hafalan Modern</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4 leading-tight">
          {BRAND_NAME}
        </h1>
        <p className="text-base sm:text-lg text-emerald-700 dark:text-emerald-400 font-semibold mb-6">
          Pantau Perkembangan Hafalan Al-Qur&apos;an Secara{' '}
          <span className="underline decoration-emerald-400/50">Real-Time &amp; Terstruktur</span>
        </p>

        <p className="text-lg text-slate-600 dark:text-slate-400 mb-10 max-w-2xl leading-relaxed">
          Kemudahan bagi Ustadz dalam mencatat setoran Ziyadah &amp; Muraja&apos;ah, serta transparansi penuh bagi Santri dan Wali Santri dalam memantau target hafalan harian.
        </p>

        {/* Gate Choice / Role Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl text-left">
          {/* Card Ustadz */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:border-emerald-500 dark:hover:border-emerald-500 transition-all group flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
                <UserCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-2">Portal Ustadz / Penguji</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Akses lengkap untuk input setoran baru, penilaian kualitas tajwid/makhraj, dan kelola data santri bimbingan.
              </p>
            </div>
            <Link
              href="/login?role=ustadz"
              className="inline-flex items-center justify-between w-full text-sm font-semibold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform"
            >
              <span>Login Ustadz</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Card Santri & Wali */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:border-emerald-500 dark:hover:border-emerald-500 transition-all group flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4 group-hover:scale-110 transition-transform">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-2">Santri &amp; Wali Santri</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Akses cepat menggunakan Kode Unik / PIN Santri tanpa perlu registrasi email untuk melihat progres hafalan.
              </p>
            </div>
            <Link
              href="/portal"
              className="inline-flex items-center justify-between w-full text-sm font-semibold text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform"
            >
              <span>Masuk via Kode Unik</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 dark:text-slate-500">
        <p>
          &copy; {new Date().getFullYear()} {BRAND_NAME} &bull; {BRAND_TAGLINE}
        </p>
      </footer>
    </div>
  );
}
