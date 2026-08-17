import { getStore, TABLES } from "@/lib/db";
import { DEFAULT_SETTINGS } from "@/lib/config/default-settings";
import type { AppSettings } from "@/types";

export async function getSettings(): Promise<AppSettings> {
  const store = getStore();
  const existing = await store.get<AppSettings>(TABLES.appSettings, "default");
  if (existing) return existing;
  return store.insert<AppSettings>(TABLES.appSettings, DEFAULT_SETTINGS);
}

export async function updateSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
  const store = getStore();
  const existing = await getSettings();
  return store.update<AppSettings>(TABLES.appSettings, existing.id, {
    ...patch,
    updated_at: new Date().toISOString(),
  });
}
