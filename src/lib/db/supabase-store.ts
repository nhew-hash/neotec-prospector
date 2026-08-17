import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Store, Identifiable, QueryOptions } from "./store";

// Real database implementation, active once NEXT_PUBLIC_SUPABASE_URL and
// SUPABASE_SERVICE_ROLE_KEY are set (see .env.example). Uses the service
// role key because all writes happen from trusted server-side API routes
// only — the browser never talks to Supabase directly in this app.

let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY."
    );
  }
  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export class SupabaseStore implements Store {
  isLive(): boolean {
    return true;
  }

  async list<T extends Identifiable>(table: string, opts: QueryOptions<T> = {}): Promise<T[]> {
    let query = getClient().from(table).select("*");
    if (opts.where) {
      for (const [key, value] of Object.entries(opts.where)) {
        if (value === undefined) continue;
        query = query.eq(key, value as string | number | boolean);
      }
    }
    if (opts.orderBy) {
      query = query.order(opts.orderBy.field, { ascending: opts.orderBy.dir === "asc" });
    }
    if (opts.limit) query = query.limit(opts.limit);
    const { data, error } = await query;
    if (error) throw new Error(`[supabase] list ${table}: ${error.message}`);
    return (data ?? []) as T[];
  }

  async get<T extends Identifiable>(table: string, id: string): Promise<T | null> {
    const { data, error } = await getClient().from(table).select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(`[supabase] get ${table}/${id}: ${error.message}`);
    return (data as T) ?? null;
  }

  async insert<T extends Identifiable>(table: string, data: Partial<T> & { id?: string }): Promise<T> {
    const { data: row, error } = await getClient().from(table).insert(data).select().single();
    if (error) throw new Error(`[supabase] insert ${table}: ${error.message}`);
    return row as T;
  }

  async update<T extends Identifiable>(table: string, id: string, patch: Partial<T>): Promise<T> {
    const { data: row, error } = await getClient()
      .from(table)
      .update(patch as Record<string, unknown>)
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(`[supabase] update ${table}/${id}: ${error.message}`);
    return row as T;
  }

  async remove(table: string, id: string): Promise<void> {
    const { error } = await getClient().from(table).delete().eq("id", id);
    if (error) throw new Error(`[supabase] remove ${table}/${id}: ${error.message}`);
  }
}
