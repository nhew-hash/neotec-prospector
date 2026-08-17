import { getStore, TABLES } from "@/lib/db";
import type { Company } from "@/types";

export async function listCompanies(): Promise<Company[]> {
  const store = getStore();
  return store.list<Company>(TABLES.companies, { orderBy: { field: "created_at", dir: "desc" } });
}

export async function getCompany(id: string): Promise<Company | null> {
  const store = getStore();
  return store.get<Company>(TABLES.companies, id);
}
