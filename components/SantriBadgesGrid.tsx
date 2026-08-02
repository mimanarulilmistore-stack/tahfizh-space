"use client";

import React, { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";

interface SantriQRCodeCardProps {
  santri: {
    id: string;
    name: string;
    uniqueCode: string; // Contoh: 'SANTRI-001'
    classGroup?: string;
  };
  baseUrl?: string; // Menampung domain Vercel (opsional)
}

export default function SantriQRCodeCard({
  santri,
  baseUrl,
}: SantriQRCodeCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // Penentuan Origin Domain (Otomatis mengambil domain Vercel saat dipublikasikan)
  const origin =
    baseUrl ||
    (typeof window !== "undefined"
      ? window.location.origin
      : "https://tahfizh-space.vercel.app");

  // Dynamic Magic Link: URL unik langsung menuju profil santri bersangkutan
  const qrTargetUrl = `${origin}/santri/${santri.uniqueCode}`;

  // Fungsi untuk mengunduh QR Code sebagai gambar SVG/Cetak Kartu
  const handleDownloadQR = () => {
    const svgElement = cardRef.current?.querySelector("svg");
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);

    const downloadLink = document.createElement("a");
    downloadLink.href = svgUrl;
    downloadLink.download = `QR-Santri-${santri.uniqueCode}-${santri.name.replace(/\s+/g, "_")}.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(svgUrl);
  };

  return (
    <div className="w-full max-w-sm rounded-2xl border border-emerald-100 bg-white p-6 shadow-xl dark:border-emerald-950 dark:bg-slate-900 transition-all duration-300 hover:shadow-2xl">
      {/* Header Kartu */}
      <div className="mb-5 text-center">
        <div className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 mb-2">
          Kartu Akses Wali Santri
        </div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
          {santri.name}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Kode Unik: <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{santri.uniqueCode}</span>
          {santri.classGroup && ` • ${santri.classGroup}`}
        </p>
      </div>

      {/* Kontainer QR Code */}
      <div
        ref={cardRef}
        className="flex flex-col items-center justify-center rounded-xl bg-emerald-50/50 p-6 border border-emerald-100 dark:bg-slate-800/50 dark:border-slate-700"
      >
        <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-slate-900">
          <QRCodeSVG
            value={qrTargetUrl}
            size={180}
            bgColor={"#FFFFFF"}
            fgColor={"#047857"} // Emerald 700
            level={"H"} // High error correction
            includeMargin={false}
          />
        </div>
        <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400 max-w-[220px]">
          Pindai QR ini untuk membuka portal mutaba'ah & capaian hafalan secara langsung.
        </p>
      </div>

      {/* Tombol Aksi */}
      <div className="mt-6 flex gap-3">
        <button
          onClick={handleDownloadQR}
          className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            ></path>
          </svg>
          Unduh QR Code
        </button>
      </div>
    </div>
  );
}