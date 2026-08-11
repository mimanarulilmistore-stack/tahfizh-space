'use client';

import React, { useState } from 'react';
import {
  buildPesanSetoranWali,
  copyTextToClipboard,
  type PesanSetoranWaliInput,
} from '@/src/utils/pesanWali';
import { Check, Copy, MessageCircle, X } from 'lucide-react';

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

  if (variant === 'compact') {
    return (
      <div className={className}>
        <button
          type="button"
          onClick={async () => {
            setOpen(true);
            await handleCopy();
          }}
          className="p-1.5 rounded-lg bg-sky-950/40 hover:bg-sky-900 border border-sky-800/60 text-sky-300"
          title="Salin pesan untuk wali (WhatsApp manual)"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <MessageCircle className="w-3.5 h-3.5" />}
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
              <p className="text-[11px] text-slate-400">
                Manual: salin teks ini, lalu tempel ke WhatsApp wali. Tidak ada pengiriman otomatis.
              </p>
              <textarea
                readOnly
                value={pesan}
                rows={12}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 font-mono"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="w-full px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Tersalin!' : 'Salin ke Clipboard'}
              </button>
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
            Notifikasi Manual ke Wali
          </h3>
          <p className="text-[11px] text-sky-300/80 mt-0.5">
            Salin pesan → tempel ke WhatsApp. Tidak memakai API / pengiriman otomatis.
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

      <button
        type="button"
        onClick={handleCopy}
        className="w-full sm:w-auto px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl inline-flex items-center justify-center gap-2"
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        {copied ? 'Pesan tersalin — tempel di WhatsApp' : 'Salin Pesan untuk Wali'}
      </button>
    </div>
  );
}
