// Generic data-access abstraction.
//
// The rest of the app talks only to this interface. Two implementations exist:
//  - LocalJsonStore: file-backed JSON store, used when Supabase env vars are absent.
//    Great for running the product immediately without any external setup.
//  - SupabaseStore: talks to a real Postgres/Supabase project once
//    NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are configured.
//
// Swapping between them requires zero changes to pages, API routes or business logic.

/** Minimal shape every persisted domain record must have. */
export interface Identifiable {
  id: string;
}

/** Loose bag-of-fields shape used internally by the local JSON store. */
export type StoreRecord = Identifiable & Record<string, unknown>;

export interface QueryOptions<T = Identifiable> {
  where?: Partial<Record<keyof T, unknown>>;
  orderBy?: { field: keyof T & string; dir: "asc" | "desc" };
  limit?: number;
}

export interface Store {
  list<T extends Identifiable>(table: string, opts?: QueryOptions<T>): Promise<T[]>;
  get<T extends Identifiable>(table: string, id: string): Promise<T | null>;
  insert<T extends Identifiable>(table: string, data: Partial<T> & { id?: string }): Promise<T>;
  update<T extends Identifiable>(table: string, id: string, patch: Partial<T>): Promise<T>;
  remove(table: string, id: string): Promise<void>;
  /** Returns true when this store is backed by a real, configured database. */
  isLive(): boolean;
}

export const TABLES = {
  users: "users",
  companies: "companies",
  prospectingSearches: "prospecting_searches",
  leads: "leads",
  leadSources: "lead_sources",
  leadScores: "lead_scores",
  leadContacts: "lead_contacts",
  leadNotes: "lead_notes",
  leadFollowups: "lead_followups",
  leadStatusHistory: "lead_status_history",
  sales: "sales",
  commissions: "commissions",
  appSettings: "app_settings",
} as const;
