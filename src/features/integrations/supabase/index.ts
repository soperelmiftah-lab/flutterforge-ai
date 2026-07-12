/**
 * @module features/integrations/supabase
 *
 * Supabase adapter — Postgres, Auth, Storage, and Realtime for generated apps
 * AND for FlutterForge's own cloud storage layer. Planned (Phase 4).
 */

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
}

export const supabaseConfig: SupabaseConfig | null = null;

/** Connect a Supabase project. NOT IMPLEMENTED in Phase 1. */
export async function connectSupabase(_config: SupabaseConfig): Promise<void> {
  throw new Error("Supabase integration arrives in Phase 4.");
}
