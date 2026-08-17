import { getStore, TABLES } from "@/lib/db";
import type { Commission, Sale } from "@/types";
import { getSettings } from "@/lib/settings";
import { getUserById } from "@/lib/auth/users";

export async function registerSale(
  leadId: string,
  userId: string,
  product: string,
  amount: number
): Promise<{ sale: Sale; commission: Commission }> {
  const store = getStore();
  const settings = await getSettings();
  const user = await getUserById(userId);
  const pct = user?.commission_pct ?? settings.comissao_pct_padrao;

  const sale = await store.insert<Sale>(TABLES.sales, {
    lead_id: leadId,
    user_id: userId,
    product,
    amount,
    closed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  });

  const commission = await store.insert<Commission>(TABLES.commissions, {
    sale_id: sale.id,
    user_id: userId,
    pct,
    amount: Math.round(amount * (pct / 100) * 100) / 100,
    created_at: new Date().toISOString(),
  });

  return { sale, commission };
}

export async function listSales(): Promise<Sale[]> {
  const store = getStore();
  return store.list<Sale>(TABLES.sales, { orderBy: { field: "closed_at", dir: "desc" } });
}

export async function listCommissions(): Promise<Commission[]> {
  const store = getStore();
  return store.list<Commission>(TABLES.commissions);
}
