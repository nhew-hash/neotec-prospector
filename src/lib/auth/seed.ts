import bcrypt from "bcryptjs";
import { getStore, TABLES } from "@/lib/db";
import type { User } from "@/types";

// Seeds two demo accounts so the product is immediately usable:
//  - admin@neotec.com.br / neotec123 (admin)
//  - ana@neotec.com.br / vendas123 (vendedora)
// Change these passwords immediately in a real deployment (Configurações > Usuários).
// This only runs against the local JSON store automatically; for Supabase,
// run supabase/migrations/0002_seed.sql (or create users via the app once
// a signup/admin-invite flow exists).

let seeded = false;

export async function ensureSeedUsers(): Promise<void> {
  if (seeded) return;
  const store = getStore();
  if (store.isLive()) {
    // Supabase is configured — do not auto-seed a live database from app code.
    seeded = true;
    return;
  }

  const existing = await store.list<User>(TABLES.users);
  if (existing.length > 0) {
    seeded = true;
    return;
  }

  const adminHash = await bcrypt.hash("neotec123", 10);
  const vendedoraHash = await bcrypt.hash("vendas123", 10);
  const now = new Date().toISOString();

  await store.insert<User>(TABLES.users, {
    id: "00000000-0000-0000-0000-000000000001",
    name: "Administrador Neotec",
    email: "admin@neotec.com.br",
    password_hash: adminHash,
    role: "admin",
    phone: "(34) 99999-0000",
    status: "ativo",
    monthly_goal: 0,
    weekly_goal: 0,
    commission_pct: 0,
    created_at: now,
  });

  await store.insert<User>(TABLES.users, {
    id: "00000000-0000-0000-0000-000000000002",
    name: "Ana Souza",
    email: "ana@neotec.com.br",
    password_hash: vendedoraHash,
    role: "vendedora",
    phone: "(34) 98888-1111",
    status: "ativo",
    monthly_goal: 15000,
    weekly_goal: 3750,
    commission_pct: 10,
    created_at: now,
  });

  seeded = true;
}
