import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getUserById, toPublicUser } from "@/lib/auth/users";
import { getVendedoraStats } from "@/lib/repository/vendedoras";
import { getBestOpportunities } from "@/lib/repository/dashboard";
import { StatCard } from "@/components/dashboard/StatCard";
import { HotLeadsList } from "@/components/dashboard/HotLeadsList";
import { formatCurrencyBRL } from "@/lib/utils/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export default async function VendedoraDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { id } = await params;

  if (session.role === "vendedora" && session.userId !== id) {
    redirect(`/vendedoras/${session.userId}`);
  }

  const user = await getUserById(id);
  if (!user) notFound();
  const publicUser = toPublicUser(user);

  const [stats, leads] = await Promise.all([getVendedoraStats(publicUser), getBestOpportunities(10, id)]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Minha prospecção — {user.name}</h1>
        <p className="text-sm text-muted mt-1">{user.email} · {user.phone ?? "Sem telefone"}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Leads recebidos" value={stats.leads_recebidos} />
        <StatCard label="Ligações" value={stats.ligacoes} />
        <StatCard label="Contatos" value={stats.contatos} />
        <StatCard label="Interessados" value={stats.interessados} />
        <StatCard label="Propostas" value={stats.propostas} />
        <StatCard label="Vendas" value={stats.vendas} />
        <StatCard label="Conversão" value={`${stats.conversao_pct}%`} />
        <StatCard label="Valor vendido" value={formatCurrencyBRL(stats.valor_vendido)} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Comissão</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-2xl font-semibold text-brand-500">{formatCurrencyBRL(stats.comissao)}</p>
            <p className="text-xs text-muted mt-1">
              {user.commission_pct ?? "—"}% sobre vendas fechadas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Metas</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted">Meta semanal</p>
              <p className="font-medium text-foreground">{formatCurrencyBRL(user.weekly_goal)}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Meta mensal</p>
              <p className="font-medium text-foreground">{formatCurrencyBRL(user.monthly_goal)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <HotLeadsList leads={leads} title="🔥 Meus melhores leads para ligar" />
    </div>
  );
}
