import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { addLeadFollowup, markFollowupDone } from "@/lib/repository/leads";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const date = (body?.next_contact_date ?? "").toString();
  const time = body?.next_contact_time ? body.next_contact_time.toString() : null;
  const observation = body?.observation ? body.observation.toString() : null;

  if (!date) return NextResponse.json({ error: "Informe a data do próximo contato." }, { status: 400 });

  const created = await addLeadFollowup(id, session.userId, date, time, observation);
  return NextResponse.json(created);
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const body = await req.json().catch(() => null);
  const followupId = body?.followupId as string | undefined;
  const done = Boolean(body?.done);
  if (!followupId) return NextResponse.json({ error: "followupId obrigatório." }, { status: 400 });
  const updated = await markFollowupDone(followupId, done);
  return NextResponse.json(updated);
}
