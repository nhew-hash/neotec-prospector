import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { runProspecting } from "@/lib/prospecting/run-prospecting";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const city = (body?.city ?? "").toString().trim();
  const state = (body?.state ?? "").toString().trim().toUpperCase();
  const radiusKm = Number(body?.radiusKm ?? 0);
  const segments: string[] = Array.isArray(body?.segments) ? body.segments : [];
  const quantity = Math.max(1, Math.min(200, Number(body?.quantity ?? 0)));

  if (!city || !state || !radiusKm || !quantity) {
    return NextResponse.json(
      { error: "Preencha cidade, estado, raio e quantidade de empresas." },
      { status: 400 }
    );
  }

  try {
    const result = await runProspecting(
      { city, state, radiusKm, segments, quantity },
      session.userId
    );
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao executar a prospecção.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
