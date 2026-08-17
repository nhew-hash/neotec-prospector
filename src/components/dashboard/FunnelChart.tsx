import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import type { FunnelCounts } from "@/types";

const STEPS: { key: keyof FunnelCounts; label: string }[] = [
  { key: "encontrados", label: "Encontrados" },
  { key: "contatados", label: "Contatados" },
  { key: "interessados", label: "Interessados" },
  { key: "propostas", label: "Propostas" },
  { key: "vendas", label: "Vendas" },
];

export function FunnelChart({ funnel }: { funnel: FunnelCounts }) {
  const max = Math.max(funnel.encontrados, 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Funil de prospecção</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-3">
          {STEPS.map((step) => {
            const value = funnel[step.key];
            const pct = Math.max((value / max) * 100, value > 0 ? 4 : 0);
            return (
              <div key={step.key}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium text-foreground">{step.label}</span>
                  <span className="text-muted">{value}</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
