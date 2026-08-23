import { BRAND_TEAM_SIGNATURE } from '@/src/config/brand';

export type PesanSetoranWaliInput = {
  namaSantri: string;
  kodeUnik?: string | null;
  noWaWali?: string | null;
  jenisSetoran: string;
  namaSurah?: string | null;
  juz?: number | null;
  ayatMulai?: number | string | null;
  ayatSelesai?: number | string | null;
  nilaiKelancaran?: string | null;
  nilaiTajwid?: string | null;
  catatan?: string | null;
  juzSelesai?: boolean | null;
  tanggalSetoran?: string | null;
  portalUrl?: string | null;
};

function formatTanggalId(raw?: string | null) {
  if (!raw)
    return new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  const d = /^\d{4}-\d{2}-\d{2}$/.test(raw)
    ? new Date(`${raw}T12:00:00`)
    : new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Normalisasi nomor ke format internasional tanpa +.
 * 0812... → 62812... | +62 812... → 62812...
 */
export function normalizeWaNumber(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let n = String(raw).trim();
  if (!n) return null;
  n = n.replace(/[^\d+]/g, '');
  if (n.startsWith('+')) n = n.slice(1);
  if (n.startsWith('0')) n = `62${n.slice(1)}`;
  if (!/^\d{10,15}$/.test(n)) return null;
  return n;
}

/** Template pesan untuk WhatsApp (tanpa API otomatis). */
export function buildPesanSetoranWali(input: PesanSetoranWaliInput): string {
  const jenis = (input.jenisSetoran || '').toLowerCase() === 'murajaah' ? 'Murajaah' : 'Ziyadah';
  const surah = input.namaSurah?.trim() || '-';
  const ayat =
    input.ayatMulai != null && String(input.ayatMulai) !== ''
      ? `${input.ayatMulai}–${input.ayatSelesai ?? input.ayatMulai}`
      : '-';
  const juz = input.juz != null ? String(input.juz) : '-';
  const lines = [
    `Assalamu'alaikum Wr. Wb.`,
    ``,
    `Yth. Wali Santri *${input.namaSantri}*`,
    ``,
    `Berikut laporan setoran hafalan terbaru:`,
    `📅 ${formatTanggalId(input.tanggalSetoran)}`,
    `📖 Jenis: ${jenis}`,
    `📗 Surah: ${surah} (Ayat ${ayat})`,
    `🔢 Juz: ${juz}${input.juzSelesai ? ' ✅ (ditandai selesai)' : ''}`,
    `⭐ Kelancaran: ${input.nilaiKelancaran || '-'}`,
    `⭐ Tajwid: ${input.nilaiTajwid || '-'}`,
  ];

  if (input.catatan?.trim()) {
    lines.push(`📝 Catatan ustadz: ${input.catatan.trim()}`);
  }

  lines.push(``);
  if (input.portalUrl) {
    lines.push(`Pantau progres lengkap di:`);
    lines.push(input.portalUrl);
  } else if (input.kodeUnik) {
    lines.push(`PIN portal wali: ${input.kodeUnik}`);
  }

  lines.push(``);
  lines.push(`Jazakumullahu khairan.`);
  lines.push(`— ${BRAND_TEAM_SIGNATURE}`);

  return lines.join('\n');
}

/** URL WhatsApp click-to-chat (admin tinggal tekan Kirim di aplikasi WA). */
export function buildWhatsAppClickToChatUrl(
  noWaWali: string | null | undefined,
  pesan: string
): string | null {
  const phone = normalizeWaNumber(noWaWali);
  if (!phone) return null;
  return `https://wa.me/${phone}?text=${encodeURIComponent(pesan)}`;
}

export type PesanSppWaliInput = {
  namaSantri: string;
  noWaWali?: string | null;
  periodeLabel: string;
  nominal: number;
  formatNominal: (n: number) => string;
};

/**
 * Pengingat SPP yang belum lunas — nada sopan & islami (bukan penagihan kasar).
 * Pesan dibuka lewat wa.me; admin tetap menekan Kirim di WhatsApp.
 */
export function buildPesanSppWali(input: PesanSppWaliInput): string {
  const nominal = input.formatNominal(input.nominal);
  return [
    `Assalamu'alaikum warahmatullahi wabarakatuh.`,
    ``,
    `Yth. Bapak/Ibu Wali Santri *${input.namaSantri}*`,
    ``,
    `Semoga Bapak/Ibu senantiasa dalam lindungan Allah SWT, diberikan kesehatan, kelancaran rezeki, dan kemudahan dalam segala urusan. Aamiin.`,
    ``,
    `Dengan penuh hormat, kami ingin mengingatkan bahwa *SPP bulanan* ananda *${input.namaSantri}* untuk periode *${input.periodeLabel}* sebesar *${nominal}* masih tercatat *belum lunas* di sistem kami.`,
    ``,
    `Mohon kiranya Bapak/Ibu berkenan menunaikannya apabila berkenan dan mampu. Semoga infak pendidikan ini menjadi amal jariyah dan keberkahan bagi keluarga.`,
    ``,
    `Apabila SPP sudah dibayarkan, mohon abaikan pesan ini atau sampaikan konfirmasi kepada kami agar data dapat kami perbarui.`,
    ``,
    `Jazakumullahu khairan katsiran.`,
    `Barakallahu fiikum.`,
    ``,
    `Hormat kami,`,
    BRAND_TEAM_SIGNATURE,
  ].join('\n');
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fallback
  }

  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
