"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function NewVendedoraForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [monthlyGoal, setMonthlyGoal] = useState(0);
  const [weeklyGoal, setWeeklyGoal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!open) {
    return (
      <Button variant="accent" size="sm" onClick={() => setOpen(true)}>
        + Nova vendedora
      </Button>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password, monthly_goal: monthlyGoal, weekly_goal: weeklyGoal }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao criar vendedora.");
        return;
      }
      setOpen(false);
      setName("");
      setEmail("");
      setPhone("");
      setPassword("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nova vendedora</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <form onSubmit={submit} className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <Label>E-mail</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <Label>Telefone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <Label>Senha inicial</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <div>
            <Label>Meta mensal (R$)</Label>
            <Input type="number" value={monthlyGoal} onChange={(e) => setMonthlyGoal(Number(e.target.value))} />
          </div>
          <div>
            <Label>Meta semanal (R$)</Label>
            <Input type="number" value={weeklyGoal} onChange={(e) => setWeeklyGoal(Number(e.target.value))} />
          </div>
          {error && <p className="sm:col-span-2 text-sm text-danger-500">{error}</p>}
          <div className="sm:col-span-2 flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Criando..." : "Criar vendedora"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
