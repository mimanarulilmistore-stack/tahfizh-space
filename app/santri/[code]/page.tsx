import { createClient } from "@supabase/supabase-js";
import SantriBadgesGrid from "@/components/SantriBadgesGrid";
import Link from "next/link";

interface PageProps {
  params: Promise<{
    code: string;
  }>;
}

export default async function SantriDetailPage({ params }: PageProps) {
  const { code } = await params;
  const cleanCode = code.trim().toUpperCase();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 dark:bg-slate-950">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl dark:bg-slate-900 border border-amber-100 dark:border-amber-900/30">
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            Konfigurasi Belum Lengkap
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Variabel lingkungan Supabase belum diset di Vercel / .env.local.
          </p>
        </div>
      </main>
    );
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data: santri, error } = await supabase
    .from("profiles")
    .select("id, nama_lengkap, kode_unik, nis, target_juz")
    .eq("kode_unik", cleanCode)
    .eq("role", "santri")
    .maybeSingle();

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
            QR Code atau kode unik{" "}
            <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
              &quot;{cleanCode}&quot;
            </span>{" "}
            tidak terdaftar dalam sistem Mutaba&apos;ah.
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

  const { data: setoranList } = await supabase
    .from("setoran_hafalan")
    .select(
      "id, jenis_setoran, nama_surah, ayat_mulai, ayat_selesai, nilai_kelancaran, nilai_tajwid, catatan, created_at"
    )
    .eq("santri_id", santri.id)
    .order("created_at", { ascending: false });

  const records = setoranList || [];
  const totalZiyadah = records.filter((r) => r.jenis_setoran === "ziyadah").length;

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8 dark:bg-slate-950 transition-colors">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm dark:border-emerald-900/30 dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 mb-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Akses Instan QR Code
            </div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 sm:text-3xl">
              {santri.nama_lengkap}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Kode Unik:{" "}
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {santri.kode_unik}
              </span>
              {santri.nis && ` • NIS: ${santri.nis}`}
            </p>
          </div>

          <div className="rounded-xl bg-emerald-50 p-4 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40 text-right sm:text-left">
            <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
              Target Hafalan
            </p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {santri.target_juz || 30}{" "}
              <span className="text-sm font-normal">Juz</span>
            </p>
            <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-1">
              {totalZiyadah} ziyadah tercatat
            </p>
          </div>
        </header>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-lg font-bold text-slate-800 dark:text-slate-100">
            Pencapaian & Lencana Santri
          </h2>
          <SantriBadgesGrid santriId={santri.id} targetJuz={santri.target_juz || 30} />
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-lg font-bold text-slate-800 dark:text-slate-100">
            Riwayat Mutaba&apos;ah Terakhir
          </h2>
          {records.length > 0 ? (
            <div className="space-y-3">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40 gap-3"
                >
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      Surah {record.nama_surah || "N/A"} (Ayat {record.ayat_mulai} -{" "}
                      {record.ayat_selesai})
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(record.created_at).toLocaleDateString("id-ID", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                    {record.catatan && (
                      <p className="mt-1 text-xs text-slate-500 italic">{record.catatan}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 uppercase">
                      {record.jenis_setoran}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Kelancaran: {record.nilai_kelancaran || "-"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400 italic">
              Belum ada catatan mutaba&apos;ah yang terekam.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
