import { createBrowserClient } from "@supabase/ssr";

// Access environment variables using Next.js pattern
// If not found in env, fallback to the hardcoded values found in the legacy codebase (for smooth migration)
// TODO: Move these strictly to .env.local in production
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://ylibpukesgjdjqllzoep.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsaWJwdWtlc2dqZGpxbGx6b2VwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MDk5MTQsImV4cCI6MjA3NzQ4NTkxNH0.BCBt_Qwz6WG5ndyIJmk6sLqj7BEZ3ELPzZHTkWRT0aY";

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: {
      "Cache-Control": "no-store"
    }
  }
});
