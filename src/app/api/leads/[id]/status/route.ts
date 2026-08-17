import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { assignLead, updateLeadStatus, addLeadContact } from "@/lib/repository/leads";
import { getLeadDetail } from "@/lib/repository/leads";
import { registerSale } from "@/lib/repository/sales";
import { getSettings } from "@/lib/settings";
import type { LeadStatus } from "@/types";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const status = body?.status as LeadStatus | undefined;
  if (!status) return NextResponse.json({ error: "Status inválido." }, { status: 400 });

  const lead = await getLeadDetail(id);
  if (!lead) return NextResponse.json({ error: "Lead não encontrado." }, { status: 404 });

  if (!lead.assigned_to && session.role === "vendedora") {
    await assignLead(id, session.userId);
  }

  const updated = await updateLeadStatus(id, status, session.userId);

  if (["contato_realizado", "nao_atendeu", "interessado", "sem_interesse", "numero_invalido"].includes(status)) {
    const resultMap: Record<string, "atendeu" | "sem_resposta" | "interessado" | "sem_interesse" | "numero_invalido"> = {
      contato_realizado: "atendeu",
      nao_atendeu: "sem_resposta",
      interessado: "interessado",
      sem_interesse: "sem_interesse",
      numero_invalido: "numero_invalido",
    };
    await addLeadContact(id, session.userId, "ligacao", resultMap[status], null);
  }

  if (status === "venda_fechada") {
    const settings = await getSettings();
    await registerSale(id, session.userId, "Site institucional", settings.valor_venda_padrao);
  }

  return NextResponse.json(updated);
}
