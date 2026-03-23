/**
 * Database abstraction layer.
 * - Quick Start mode: uses Supabase client
 * - Cloud/Enterprise mode: uses DATABASE_URL with direct pg
 *
 * All server-side code should import from here instead of lib/supabase directly.
 */

import { createServerSupabase } from "./supabase";

export type QueryResult<T = Record<string, unknown>> = {
  data: T[] | null;
  error: { message: string } | null;
  count?: number;
};

function getMode(): "supabase" | "direct" {
  return process.env.DATABASE_URL ? "direct" : "supabase";
}

/**
 * Get a Supabase-compatible client.
 * In Cloud mode with DATABASE_URL, we still use Supabase client
 * pointed at the local/remote PostgreSQL via PostgREST or direct connection.
 *
 * For now, both modes use Supabase client — the DATABASE_URL mode
 * will be implemented when we add direct pg support.
 * This abstraction exists so we can swap without changing call sites.
 */
export async function getDB() {
  // Both modes currently use Supabase client.
  // Cloud mode: user sets NEXT_PUBLIC_SUPABASE_URL to their PostgREST endpoint
  // or we add direct pg support later.
  return createServerSupabase();
}

export { getMode };
