/** Generator & util kode unik / PIN santri. */

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // tanpa 0/O, 1/I

/** Format baru: SNT- + 8 karakter aman dibaca. Contoh: SNT-K7M2P9QX */
export function generateRandomKodeUnik(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  let suffix = '';
  for (let i = 0; i < bytes.length; i++) {
    suffix += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return `SNT-${suffix}`;
}

/** True jika kode bukan format PIN baru (perlu dipertimbangkan cetak ulang / regenerate). */
export function isPinFormatLama(kode: string | null | undefined): boolean {
  const k = String(kode || '')
    .trim()
    .toUpperCase();
  if (!k) return true;
  return !/^SNT-[A-Z2-9]{8}$/.test(k);
}

export function getPinFormatLabel(kode: string | null | undefined): string {
  return isPinFormatLama(kode) ? 'Format lama' : 'Format baru';
}
