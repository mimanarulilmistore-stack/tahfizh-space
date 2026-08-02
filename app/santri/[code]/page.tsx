import { createClient } from "@supabase/supabase-js";
import SantriBadgesGrid from "@/components/SantriBadgesGrid";
import Link from "next/link";

// Inisialisasi Supabase Client untuk Server Component
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface PageProps {
  params: Promise<{
    code: string;
  }>;
}

export default async function SantriDetailPage({ params }: PageProps) {
  // Unwrapping params pada Next.js App Router terbaru
  const { code } = await params;

  // Query data santri dari Supabase berdasarkan unique_code
  const { data: santri, error } = await supabase
    .from("santri")
    .select("*, mutabaah_records(*)")
    .eq("unique_code", code)
    .single();

  // State / Tampilan jika data santri tidak ditemukan di database
  if (error || !santri) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 dark:bg-slate-950">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl dark:bg-slate-900 border border-red-100 dark:border-red-900/30">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            Santri Tidak Ditemukan
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            QR Code atau kode unik <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">"{code}"</span> tidak terdaftar dalam sistem Mutaba'ah.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-emerald-700 transition-all"
          >
            Kembali ke Halaman Utama
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8 dark:bg-slate-950 transition-colors">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header Dashboard Santri */}
        <header className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm dark:border-emerald-900/30 dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 mb-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Akses Instan QR Code
            </div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 sm:text-3xl">
              {santri.name}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Kode Unik: <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{santri.unique_code}</span>
              {santri.class_group && ` • Kelompok: ${santri.class_group}`}
            </p>
          </div>

          <div className="rounded-xl bg-emerald-50 p-4 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40 text-right sm:text-left">
            <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">Total Hafalan</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {santri.total_juz || 0} <span className="text-sm font-normal">Juz</span>
            </p>
          </div>
        </header>

        {/* Section Capaian Badges / Prestasi */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <span>🏆</span> Pencapaian & Lencana Santri
          </h2>
          <SantriBadgesGrid santriId={santri.id} />
        </section>

        {/* Section Riwayat Mutaba'ah Terbaru */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <span>📖</span> Riwayat Mutaba'ah Terakhir
          </h2>
          {santri.mutabaah_records && santri.mutabaah_records.length > 0 ? (
            <div className="space-y-3">
              {santri.mutabaah_records.map((record: any) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40"
                >
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      Surah {record.surah_name || "N/A"} (Ayat {record.verse_start} - {record.verse_end})
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(record.created_at).toLocaleDateString("id-ID", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <span className="rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Nilai: {record.score || "A"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400 italic">
              Belum ada catatan mutaba'ah yang terekam.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}