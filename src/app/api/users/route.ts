import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getStore, TABLES } from "@/lib/db";
import { hashPassword } from "@/lib/auth/users";
import type { User } from "@/types";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Apenas administradores podem criar usuários." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const name = (body?.name ?? "").toString().trim();
  const email = (body?.email ?? "").toString().trim().toLowerCase();
  const phone = (body?.phone ?? "").toString().trim() || null;
  const password = (body?.password ?? "").toString();
  const monthlyGoal = Number(body?.monthly_goal ?? 0);
  const weeklyGoal = Number(body?.weekly_goal ?? 0);
  const commissionPct = body?.commission_pct !== undefined ? Number(body.commission_pct) : null;

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Nome, e-mail e senha são obrigatórios." }, { status: 400 });
  }

  const store = getStore();
  const existing = await store.list<User>(TABLES.users, { where: { email } });
  if (existing.length > 0) {
    return NextResponse.json({ error: "Já existe um usuário com este e-mail." }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const created = await store.insert<User>(TABLES.users, {
    name,
    email,
    password_hash: passwordHash,
    role: "vendedora",
    phone,
    status: "ativo",
    monthly_goal: monthlyGoal,
    weekly_goal: weeklyGoal,
    commission_pct: commissionPct,
    created_at: new Date().toISOString(),
  });

  const { password_hash: _password_hash, ...publicUser } = created;
  void _password_hash;
  return NextResponse.json(publicUser);
}
