'use client';

import React, { useState } from 'react';
import {
  buildPesanSetoranWali,
  buildWhatsAppClickToChatUrl,
  copyTextToClipboard,
  normalizeWaNumber,
  type PesanSetoranWaliInput,
} from '@/src/utils/pesanWali';
import { features } from '@/src/config/features';
import { Check, Copy, ExternalLink, MessageCircle, X } from 'lucide-react';

type SalinPesanWaliProps = {
  payload: PesanSetoranWaliInput;
  /** compact = tombol kecil di baris tabel */
  variant?: 'panel' | 'compact';
  onClose?: () => void;
  className?: string;
};

export default function SalinPesanWali({
  payload,
  variant = 'panel',
  onClose,
  className = '',
}: SalinPesanWaliProps) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(variant === 'panel');
  const pesan = buildPesanSetoranWali(payload);
  const waUrl = buildWhatsAppClickToChatUrl(payload.noWaWali, pesan);
  const hasWa = Boolean(waUrl);

  if (!features.whatsapp) return null;

  const handleCopy = async () => {
    const ok = await copyTextToClipboard(pesan);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } else {
      alert('Gagal menyalin. Silakan salin manual dari kotak teks.');
      setOpen(true);
    }
  };

  const handleKirimWa = () => {
    if (!waUrl) {
      alert(
        'Nomor WhatsApp wali belum diisi. Isi di Kelola Santri / saat tambah santri, atau salin pesan manual.'
      );
      return;
    }
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  if (variant === 'compact') {
    return (
      <div className={className}>
        <button
          type="button"
          onClick={() => {
            if (hasWa) {
              handleKirimWa();
            } else {
              setOpen(true);
            }
          }}
          className="p-1.5 rounded-lg bg-sky-950/40 hover:bg-sky-900 border border-sky-800/60 text-sky-300"
          title={
            hasWa
              ? 'Kirim via WhatsApp'
              : 'Nomor WA wali belum ada — buka pesan manual'
          }
        >
          <MessageCircle className="w-3.5 h-3.5" />
        </button>
        {open && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-sky-400" />
                  Pesan untuk Wali
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onClose?.();
                  }}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {!hasWa && (
                <p className="text-[11px] text-amber-300">
                  Nomor WA wali belum diisi. Isi di profil santri agar tombol kirim langsung ke chat.
                </p>
              )}
              <textarea
                readOnly
                value={pesan}
                rows={12}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 font-mono"
              />
              <div className="flex flex-col sm:flex-row gap-2">
                {hasWa && (
                  <button
                    type="button"
                    onClick={handleKirimWa}
                    className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Kirim via WhatsApp
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex-1 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Tersalin!' : 'Salin Teks'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border border-sky-800/60 bg-sky-950/30 p-4 space-y-3 ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-sky-200 flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Kirim Laporan ke Wali
          </h3>
          <p className="text-[11px] text-sky-300/80 mt-0.5">
            {hasWa
              ? `Membuka WhatsApp ke ${normalizeWaNumber(payload.noWaWali)} dengan pesan siap kirim.`
              : 'Nomor WA wali belum diisi — isi di profil santri, atau salin teks manual.'}
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-sky-400/70 hover:text-white"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <textarea
        readOnly
        value={pesan}
        rows={10}
        className="w-full px-3 py-2 bg-slate-950 border border-sky-900/50 rounded-xl text-xs text-slate-200 font-mono leading-relaxed"
      />

      <div className="flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          onClick={handleKirimWa}
          disabled={!hasWa}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-400 text-white text-xs font-bold rounded-xl inline-flex items-center justify-center gap-2"
        >
          <ExternalLink className="w-4 h-4" />
          Kirim via WhatsApp
        </button>
        <button
          type="button"
          onClick={handleCopy}
          className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl inline-flex items-center justify-center gap-2"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Tersalin' : 'Salin Teks'}
        </button>
      </div>
    </div>
  );
}
