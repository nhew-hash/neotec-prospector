"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { STATUS_LABELS } from "@/lib/config/default-settings";
import type { LeadStatus } from "@/types";

export function StatusControl({ leadId, currentStatus, statuses }: {
  leadId: string;
  currentStatus: LeadStatus;
  statuses: LeadStatus[];
}) {
  const router = useRouter();
  const [status, setStatus] = useState<LeadStatus>(currentStatus);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function save() {
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/leads/${leadId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Erro ao atualizar status.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
      <Select value={status} onChange={(e) => setStatus(e.target.value as LeadStatus)} className="sm:w-64">
        {statuses.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s] ?? s}
          </option>
        ))}
      </Select>
      <Button onClick={save} disabled={pending || status === currentStatus} size="md">
        {pending ? "Salvando..." : "Atualizar status"}
      </Button>
      {error && <p className="text-xs text-danger-500">{error}</p>}
    </div>
  );
}
