"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { formatDateTimeBR } from "@/lib/utils/format";
import type { LeadNote } from "@/types";

export function NotesSection({ leadId, notes }: { leadId: string; notes: LeadNote[] }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    if (!note.trim()) return;
    startTransition(async () => {
      await fetch(`/api/leads/${leadId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });
      setNote("");
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Observações</CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="flex gap-2">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ex: Cliente pediu para retornar depois das 15h."
            className="min-h-[70px]"
          />
        </div>
        <Button size="sm" onClick={submit} disabled={pending || !note.trim()}>
          Adicionar observação
        </Button>

        {notes.length > 0 && (
          <ul className="space-y-3 pt-2 border-t border-border">
            {notes.map((n) => (
              <li key={n.id} className="text-sm">
                <p className="text-foreground">{n.note}</p>
                <p className="text-xs text-muted mt-0.5">{formatDateTimeBR(n.created_at)}</p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
