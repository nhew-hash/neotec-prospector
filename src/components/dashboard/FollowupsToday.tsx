import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import type { DashboardStats } from "@/types";

export function FollowupsToday({ followups }: { followups: DashboardStats["followups_hoje"] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Follow-ups de hoje</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {followups.length === 0 ? (
          <p className="text-sm text-muted">Nenhum follow-up agendado para hoje.</p>
        ) : (
          <ul className="divide-y divide-border">
            {followups.map((f) => (
              <li key={f.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/leads/${f.lead.id}`} className="text-sm font-medium text-foreground hover:text-brand-500 truncate block">
                    {f.lead.company.name}
                  </Link>
                  {f.observation && <p className="text-xs text-muted truncate">{f.observation}</p>}
                </div>
                <span className="text-xs font-medium text-brand-500 shrink-0">
                  {f.next_contact_time ?? "Hoje"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
