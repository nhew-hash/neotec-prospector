"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function SendToCrmButton({ leadId }: { leadId: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function send() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/crm/send/${leadId}`, { method: "POST" });
      const data = await res.json();
      setMessage(data.message ?? (data.ok ? "Enviado com sucesso." : "Não foi possível enviar."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Button variant="secondary" size="sm" onClick={send} disabled={loading}>
        {loading ? "Enviando..." : "Enviar para CRM (Neotec OS)"}
      </Button>
      {message && <p className="text-xs text-muted mt-2 max-w-sm">{message}</p>}
    </div>
  );
}
