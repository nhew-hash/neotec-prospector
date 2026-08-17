import { Badge } from "@/components/ui/Badge";
import type { LeadTemperature } from "@/types";

const CONFIG: Record<LeadTemperature, { label: string; tone: "danger" | "warning" | "neutral" }> = {
  quente: { label: "🔥 Quente", tone: "danger" },
  morno: { label: "🟡 Morno", tone: "warning" },
  frio: { label: "⚪ Frio", tone: "neutral" },
};

export function TemperatureBadge({ temperature }: { temperature: LeadTemperature }) {
  const cfg = CONFIG[temperature];
  return <Badge tone={cfg.tone}>{cfg.label}</Badge>;
}
