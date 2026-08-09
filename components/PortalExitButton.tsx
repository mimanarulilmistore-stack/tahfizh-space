"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";

/** Tombol keluar portal wali/siswa → kembali ke halaman 2 opsi. */
export default function PortalExitButton() {
  return (
    <div className="flex items-center justify-end">
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition-all"
      >
        <LogOut className="w-3.5 h-3.5 text-rose-500" />
        Keluar
      </Link>
    </div>
  );
}
