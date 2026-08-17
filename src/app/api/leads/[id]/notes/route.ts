import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { addLeadNote } from "@/lib/repository/leads";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const note = (body?.note ?? "").toString().trim();
  if (!note) return NextResponse.json({ error: "Observação vazia." }, { status: 400 });

  const created = await addLeadNote(id, session.userId, note);
  return NextResponse.json(created);
}
