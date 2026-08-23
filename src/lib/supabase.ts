import { createBrowserClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

/** Placeholder agar `next build` tidak gagal saat env lokal belum diisi. */
const BUILD_PLACEHOLDER_URL = "https://placeholder.supabase.co";
const BUILD_PLACEHOLDER_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.placeholder";

export function getSupabaseEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return { supabaseUrl, supabaseAnonKey };
}

export function isSupabaseConfigured() {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();
  return Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl !== BUILD_PLACEHOLDER_URL);
}

export function getAuthErrorMessage(err: unknown, fallback: string) {
  if (!isSupabaseConfigured()) {
    return "Koneksi database belum diatur di komputer ini. Bukan karena email atau sandi salah.";
  }
  const name = err instanceof Error ? err.name : "";
  const raw = err instanceof Error ? err.message : "";
  if (
    name === "AuthRetryableFetchError" ||
    /failed to fetch|fetch failed|networkerror/i.test(raw)
  ) {
    return "Tidak bisa terhubung ke server login. Periksa internet, lalu muat ulang halaman. Ini bukan karena email atau sandi salah.";
  }
  if (/invalid login credentials/i.test(raw)) {
    return "Email atau kata sandi yang Anda masukkan salah.";
  }
  return raw || fallback;
}

/**
 * Browser client berbasis cookie (@supabase/ssr).
 * WAJIB dipakai agar middleware Next.js bisa membaca sesi login.
 */
export function getBrowserSupabase(): SupabaseClient {
  if (!browserClient) {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();
    browserClient = createBrowserClient(
      supabaseUrl || BUILD_PLACEHOLDER_URL,
      supabaseAnonKey || BUILD_PLACEHOLDER_KEY
    );
  }
  return browserClient;
}

/** Server/component client tanpa cookie (untuk query publik di server). */
export function createSupabaseClient(): SupabaseClient {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();
  return createClient(
    supabaseUrl || BUILD_PLACEHOLDER_URL,
    supabaseAnonKey || BUILD_PLACEHOLDER_KEY
  );
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getBrowserSupabase();
    const value = (client as any)[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
});
