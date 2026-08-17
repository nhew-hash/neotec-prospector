import { listLeadsWithCompany } from "@/lib/repository/leads";
import { listUsers } from "@/lib/auth/users";
import { toPublicUser } from "@/lib/auth/users";
import { getSettings } from "@/lib/settings";
import { LeadsTable } from "@/components/leads/LeadsTable";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ melhores?: string; sem_site?: string }>;
}) {
  const sp = await searchParams;
  const [leads, users, settings] = await Promise.all([
    listLeadsWithCompany(),
    listUsers(),
    getSettings(),
  ]);
  const vendedoras = users.filter((u) => u.role === "vendedora").map(toPublicUser);

  const quickFilter = sp.melhores ? "melhores" : sp.sem_site ? "sem_site" : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Leads</h1>
        <p className="text-sm text-muted mt-1">
          A vendedora consegue abrir esta tela e saber exatamente para quem ligar agora.
        </p>
      </div>
      <LeadsTable leads={leads} settings={settings} vendedoras={vendedoras} initialQuickFilter={quickFilter} />
    </div>
  );
}
