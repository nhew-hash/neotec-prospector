import { Badge } from "@/components/ui/Badge";
import { STATUS_LABELS } from "@/lib/config/default-settings";
import type { LeadStatus } from "@/types";

const TONE: Record<LeadStatus, "neutral" | "success" | "warning" | "danger" | "brand"> = {
  novo: "brand",
  contato_realizado: "neutral",
  nao_atendeu: "warning",
  retornar_depois: "warning",
  interessado: "success",
  proposta_enviada: "success",
  negociacao: "success",
  venda_fechada: "success",
  sem_interesse: "danger",
  numero_invalido: "danger",
};

export function StatusBadge({ status }: { status: LeadStatus }) {
  return <Badge tone={TONE[status]}>{STATUS_LABELS[status] ?? status}</Badge>;
}
