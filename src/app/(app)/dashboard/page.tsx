import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { getDashboardStats, getBestOpportunities } from "@/lib/repository/dashboard";
import { StatCard } from "@/components/dashboard/StatCard";
import { FunnelChart } from "@/components/dashboard/FunnelChart";
import { FollowupsToday } from "@/components/dashboard/FollowupsToday";
import { HotLeadsList } from "@/components/dashboard/HotLeadsList";
import { formatCurrencyBRL } from "@/lib/utils/format";
import { Button } from "@/components/ui/Button";

export default async function DashboardPage() {
  const session = await getSession();
  const isVendedora = session?.role === "vendedora";
  const scope = isVendedora ? session!.userId : undefined;

  const [stats, bestOpportunities] = await Promise.all([
    getDashboardStats(scope),
    getBestOpportunities(10, scope),
  ]);

  return (
    <div className="space-y-6">
      {isVendedora && (
        <Link href="/leads?melhores=1">
          <div className="rounded-2xl bg-gradient-to-r from-brand-500 to-accent-500 text-white px-6 py-6 flex items-center justify-between shadow-md hover:opacity-95 transition-opacity">
            <div>
              <p className="text-sm font-medium text-white/80">Pronta para vender?</p>
              <p className="text-xl font-semibold">🚀 Começar prospecção</p>
              <p className="text-sm text-white/80 mt-1">
                Veja agora os melhores leads ainda não trabalhados
              </p>
            </div>
            <Button variant="secondary" className="hidden sm:inline-flex">
              Ver leads
            </Button>
          </div>
        </Link>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard label="Leads encontrados" value={stats.leads_encontrados} />
        <StatCard label="Leads quentes" value={stats.leads_quentes} tone="danger" />
        <StatCard label="Para ligar hoje" value={stats.leads_para_ligar_hoje} tone="accent" />
        <StatCard label="Propostas" value={stats.propostas} />
        <StatCard label="Vendas" value={stats.vendas} />
        <StatCard label="Valor vendido" value={formatCurrencyBRL(stats.valor_vendido)} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <HotLeadsList leads={bestOpportunities} title="🔥 Melhores oportunidades" />
        </div>
        <div className="space-y-6">
          <FunnelChart funnel={stats.funil} />
          <FollowupsToday followups={stats.followups_hoje} />
        </div>
      </div>
    </div>
  );
}
