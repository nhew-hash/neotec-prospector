"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export function ApproachBox({ text, whatsapp }: { text: string; whatsapp: string | null }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(text.replace(/^"|"$/g, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const waLink = whatsapp
    ? `https://wa.me/55${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(text.replace(/^"|"$/g, ""))}`
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Abordagem sugerida</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <p className="text-sm text-foreground leading-relaxed bg-slate-100 rounded-xl p-4">{text}</p>
        <div className="flex flex-wrap gap-2 mt-3">
          <Button size="sm" onClick={copy}>
            {copied ? "Copiado!" : "COPIAR ABORDAGEM"}
          </Button>
          {waLink && (
            <a href={waLink} target="_blank" rel="noreferrer">
              <Button size="sm" variant="secondary">
                Abrir WhatsApp
              </Button>
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
