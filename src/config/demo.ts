/**
 * Akun demo untuk calon pelanggan.
 * Email (satu atau beberapa, dipisah koma) dari NEXT_PUBLIC_DEMO_EMAIL.
 * Akun ini tidak boleh mengubah kata sandi lewat UI.
 *
 * PENTING: baca process.env.NEXT_PUBLIC_* secara literal agar ikut ter-inline
 * di bundle browser.
 */

function parseDemoEmails(raw: string | undefined): string[] {
  if (raw == null || String(raw).trim() === '') return [];
  return String(raw)
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

const DEMO_EMAILS = parseDemoEmails(process.env.NEXT_PUBLIC_DEMO_EMAIL);

/** True jika email cocok dengan daftar akun demo. */
export function isDemoAccountEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;
  return DEMO_EMAILS.includes(normalized);
}

/** Ada minimal satu email demo yang dikonfigurasi. */
export function hasDemoAccountsConfigured(): boolean {
  return DEMO_EMAILS.length > 0;
}
