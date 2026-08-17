import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getLeadDetail } from "@/lib/repository/leads";

// Stub for the future "Enviar para CRM" integration with Neotec OS.
// Required env vars once available: NEOTEC_OS_API_URL, NEOTEC_OS_API_KEY.
// This route validates the lead exists and reports whether the
// integration is configured, without inventing a fake success response.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ leadId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const { leadId } = await params;

  const lead = await getLeadDetail(leadId);
  if (!lead) return NextResponse.json({ error: "Lead não encontrado." }, { status: 404 });

  const configured = Boolean(process.env.NEOTEC_OS_API_URL && process.env.NEOTEC_OS_API_KEY);
  if (!configured) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Integração com o Neotec OS ainda não configurada. Defina NEOTEC_OS_API_URL e NEOTEC_OS_API_KEY no .env para habilitar o envio automático.",
      },
      { status: 501 }
    );
  }

  // TODO: implement the real POST to Neotec OS CRM once the API is available.
  return NextResponse.json({ ok: false, message: "Integração ainda não implementada." }, { status: 501 });
}
