import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ScoreBadge } from "@/components/leads/ScoreBadge";
import { TemperatureBadge } from "@/components/leads/TemperatureBadge";
import type { LeadWithCompany } from "@/types";

export function HotLeadsList({ leads, title }: { leads: LeadWithCompany[]; title: string }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <Link href="/leads" className="text-xs font-medium text-brand-500 hover:underline">
          Ver todos
        </Link>
      </CardHeader>
      <CardContent className="pt-4">
        {leads.length === 0 ? (
          <p className="text-sm text-muted">Nenhum lead ainda. Crie uma prospecção para começar.</p>
        ) : (
          <ul className="divide-y divide-border">
            {leads.map((lead) => (
              <li key={lead.id}>
                <Link
                  href={`/leads/${lead.id}`}
                  className="flex items-center gap-3 py-3 hover:bg-slate-100/60 -mx-2 px-2 rounded-lg transition-colors"
                >
                  <ScoreBadge score={lead.score} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{lead.company.name}</p>
                    <p className="text-xs text-muted truncate">
                      {lead.segment} · {lead.company.city}/{lead.company.state}
                    </p>
                  </div>
                  <TemperatureBadge temperature={lead.temperature} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
