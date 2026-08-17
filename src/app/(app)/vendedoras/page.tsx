import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { listUsers, toPublicUser } from "@/lib/auth/users";
import { getVendedoraStats } from "@/lib/repository/vendedoras";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCurrencyBRL } from "@/lib/utils/format";
import { NewVendedoraForm } from "./NewVendedoraForm";
import { redirect } from "next/navigation";

export default async function VendedorasPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  if (session.role === "vendedora") {
    redirect(`/vendedoras/${session.userId}`);
  }

  const users = await listUsers();
  const vendedoras = users.filter((u) => u.role === "vendedora").map(toPublicUser);
  const stats = await Promise.all(vendedoras.map((v) => getVendedoraStats(v)));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Vendedora</h1>
          <p className="text-sm text-muted mt-1">Equipe comercial e desempenho individual.</p>
        </div>
        <NewVendedoraForm />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {vendedoras.map((v, i) => {
          const s = stats[i];
          return (
            <Link key={v.id} href={`/vendedoras/${v.id}`}>
              <Card className="hover:border-brand-500/50 transition-colors h-full">
                <CardContent className="pt-5">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-foreground">{v.name}</p>
                    <Badge tone={v.status === "ativo" ? "success" : "neutral"}>{v.status}</Badge>
                  </div>
                  <p className="text-xs text-muted mt-1">{v.email}</p>
                  <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                    <div>
                      <p className="text-xs text-muted">Leads</p>
                      <p className="font-medium text-foreground">{s.leads_recebidos}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted">Vendas</p>
                      <p className="font-medium text-foreground">{s.vendas}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted">Conversão</p>
                      <p className="font-medium text-foreground">{s.conversao_pct}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted">Valor vendido</p>
                      <p className="font-medium text-foreground">{formatCurrencyBRL(s.valor_vendido)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
        {vendedoras.length === 0 && (
          <p className="text-sm text-muted">Nenhuma vendedora cadastrada ainda.</p>
        )}
      </div>
    </div>
  );
}
