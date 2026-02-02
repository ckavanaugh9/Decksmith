import { createBrowserClient } from "@supabase/ssr";

/** Browser Supabase client. Uses NEXT_PUBLIC_* only so this file stays client-safe. */
export function createClient() {
  const url = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_SUPABASE_URL : undefined;
  const key = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY : undefined;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required");
  return createBrowserClient(url, key);
}
