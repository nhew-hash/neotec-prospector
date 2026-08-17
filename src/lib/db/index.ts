import { LocalJsonStore } from "./local-store";
import { isSupabaseConfigured, SupabaseStore } from "./supabase-store";
import type { Store } from "./store";

let storeInstance: Store | null = null;

/** Returns the active Store implementation: Supabase when configured, local JSON otherwise. */
export function getStore(): Store {
  if (storeInstance) return storeInstance;
  storeInstance = isSupabaseConfigured() ? new SupabaseStore() : new LocalJsonStore();
  return storeInstance;
}

export { TABLES } from "./store";
export type { Store, StoreRecord, Identifiable, QueryOptions } from "./store";
