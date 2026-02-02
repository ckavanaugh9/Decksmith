/**
 * Shared env config for DeckSmith AI.
 * Load from here so all code (Next.js API routes, scripts, other agents) uses the same source.
 * Values come from .env.local at project root (Next.js loads it automatically).
 */

function getEnv(key: string): string | undefined {
  return typeof process !== "undefined" ? process.env[key] : undefined;
}

export const env = {
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: getEnv("NEXT_PUBLIC_SUPABASE_URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  SUPABASE_SERVICE_ROLE_KEY: getEnv("SUPABASE_SERVICE_ROLE_KEY"),

  // OpenAI
  OPENAI_API_KEY: getEnv("OPENAI_API_KEY"),
  OPENAI_MODEL: getEnv("OPENAI_MODEL") ?? "gpt-4o",

  // Exa (URL ingestion)
  EXA_API_KEY: getEnv("EXA_API_KEY"),

  // Hyperspell (user preferences / memories)
  HYPERSPELL_API_KEY: getEnv("HYPERSPELL_API_KEY"),

  // Elevenlabs (voice / TTS)
  ELEVENLABS_API_KEY: getEnv("ELEVENLABS_API_KEY"),

  // Fal.ai (id:secret format)
  FAL_KEY: getEnv("FAL_KEY"),

  // Stripe
  STRIPE_SECRET_KEY: getEnv("STRIPE_SECRET_KEY"),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: getEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"),
  STRIPE_WEBHOOK_SECRET: getEnv("STRIPE_WEBHOOK_SECRET"),

  // Optional storage
  NEXT_PUBLIC_STORAGE_URL: getEnv("NEXT_PUBLIC_STORAGE_URL"),
} as const;
