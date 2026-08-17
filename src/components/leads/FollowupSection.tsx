"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { formatDateBR, todayISODate } from "@/lib/utils/format";
import type { LeadFollowup } from "@/types";

export function FollowupSection({ leadId, followups }: { leadId: string; followups: LeadFollowup[] }) {
  const router = useRouter();
  const [date, setDate] = useState(todayISODate());
  const [time, setTime] = useState("");
  const [observation, setObservation] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    if (!date) return;
    startTransition(async () => {
      await fetch(`/api/leads/${leadId}/followup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ next_contact_date: date, next_contact_time: time || null, observation: observation || null }),
      });
      setObservation("");
      router.refresh();
    });
  }

  function toggleDone(followupId: string, done: boolean) {
    startTransition(async () => {
      await fetch(`/api/leads/${leadId}/followup`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followupId, done }),
      });
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Follow-up</CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label>Próximo contato (data)</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <Label>Horário</Label>
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
        </div>
        <div>
          <Label>Observação</Label>
          <Textarea value={observation} onChange={(e) => setObservation(e.target.value)} placeholder="Ex: Cliente pediu para retornar depois das 15h." />
        </div>
        <Button size="sm" onClick={submit} disabled={pending}>
          Agendar follow-up
        </Button>

        {followups.length > 0 && (
          <ul className="space-y-2 pt-2 border-t border-border">
            {followups.map((f) => (
              <li key={f.id} className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={f.done}
                  onChange={(e) => toggleDone(f.id, e.target.checked)}
                  className="mt-1 rounded border-border"
                />
                <div className={f.done ? "line-through text-muted" : ""}>
                  <p className="text-foreground">
                    {formatDateBR(f.next_contact_date)} {f.next_contact_time ? `às ${f.next_contact_time}` : ""}
                  </p>
                  {f.observation && <p className="text-xs text-muted">{f.observation}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
