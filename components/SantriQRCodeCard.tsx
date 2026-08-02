"use client";

import React, { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";

interface SantriQRCodeCardProps {
  santri: {
    id: string;
    name: string;
    uniqueCode?: string;
    unique_code?: string; // Menangani schema Supabase (snake_case)
    classGroup?: string;
    class_group?: string;
  };
  baseUrl?: string;
}

export default function SantriQRCodeCard({
  santri,
  baseUrl,
}: SantriQRCodeCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // Normalisasi atribut (Mendukung camelCase maupun snake_case)
  const code = santri.uniqueCode || santri.unique_code || "UNKNOWN";
  const group = santri.classGroup || santri.class_group;

  // Penentuan Origin Domain otomatis
  const origin =
    baseUrl ||
    (typeof window !== "undefined" && window.location.origin
      ? window.location.origin
      : "https://tahfizh-space.vercel.app");

  // Dynamic Magic Link untuk Target QR Code
  const qrTargetUrl = `${origin}/santri/${code}`;

  // 1. Fungsi Unduh File SVG QR Code
  const handleDownloadQR = () => {
    const svgElement = cardRef.current?.querySelector("svg");
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);

    const downloadLink = document.createElement("a");
    downloadLink.href = svgUrl;
    downloadLink.download = `QR-Santri-${code}-${santri.name.replace(/\s+/g, "_")}.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(svgUrl);
  };

  // 2. Fungsi Cetak Kartu Langsung / Simpan PDF (Print Friendly)
  const handlePrintCard = () => {
    window.print();
  };

  return (
    <div className="w-full max-w-sm rounded-2xl border border-emerald-100 bg-white p-6 shadow-xl dark:border-emerald-950 dark:bg-slate-900 transition-all duration-300 hover:shadow-2xl print:border-2 print:border-slate-800 print:shadow-none print:bg-white print:text-black">
      {/* Header Kartu */}
      <div className="mb-5 text-center">
        <div className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 mb-2 print:bg-slate-200 print:text-slate-800">
          Kartu Akses Wali Santri
        </div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 print:text-black">
          {santri.name}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 print:text-slate-700">
          Kode Unik:{" "}
          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 print:text-black">
            {code}
          </span>
          {group && ` • ${group}`}
        </p>
      </div>

      {/* Kontainer QR Code */}
      <div
        ref={cardRef}
        className="flex flex-col items-center justify-center rounded-xl bg-emerald-50/50 p-6 border border-emerald-100 dark:bg-slate-800/50 dark:border-slate-700 print:bg-white print:border-slate-300"
      >
        <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-slate-900 print:shadow-none print:border print:border-slate-200">
          <QRCodeSVG
            value={qrTargetUrl}
            size={180}
            bgColor={"#FFFFFF"}
            fgColor={"#047857"} // Emerald 700
            level={"H"}
            includeMargin={false}
          />
        </div>
        <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400 max-w-[220px] print:text-slate-600">
          Pindai QR ini untuk membuka portal mutaba'ah & capaian hafalan secara langsung.
        </p>
      </div>

      {/* Tombol Aksi (Disembunyikan saat dicetak/print) */}
      <div className="mt-6 flex flex-col gap-2.5 print:hidden">
        <button
          onClick={handleDownloadQR}
          type="button"
          className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Unduh SVG QR
        </button>

        <button
          onClick={handlePrintCard}
          type="button"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 000-4H9a2 2 0 000 4zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Cetak Kartu / PDF
        </button>
      </div>
    </div>
  );
}