"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Input, Label, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { AppSettings } from "@/types";
import type { RunProspectingResult } from "@/lib/prospecting/run-prospecting";

const ESTADOS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB",
  "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

export function ProspectingForm({ settings }: { settings: AppSettings }) {
  const router = useRouter();
  const [city, setCity] = useState("");
  const [state, setState] = useState("MG");
  const [radiusKm, setRadiusKm] = useState(settings.raio_padrao_km);
  const [segments, setSegments] = useState<string[]>([]);
  const [allSegments, setAllSegments] = useState(false);
  const [quantity, setQuantity] = useState(settings.quantidade_padrao);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RunProspectingResult | null>(null);

  function toggleSegment(segment: string) {
    setSegments((prev) =>
      prev.includes(segment) ? prev.filter((s) => s !== segment) : [...prev, segment]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/prospecting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city,
          state,
          radiusKm,
          segments: allSegments ? ["Todos os segmentos"] : segments,
          quantity,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao gerar prospecção.");
        return;
      }
      setResult(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-3">Localização</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Araguari"
                  list="cidades-sugeridas"
                  required
                />
                <datalist id="cidades-sugeridas">
                  {settings.cidades_sugeridas.map((c) => (
                    <option key={c} value={c.split(" - ")[0]} />
                  ))}
                </datalist>
              </div>
              <div>
                <Label htmlFor="state">Estado</Label>
                <Select id="state" value={state} onChange={(e) => setState(e.target.value)}>
                  {ESTADOS.map((uf) => (
                    <option key={uf} value={uf}>
                      {uf}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="mt-4 max-w-xs">
              <Label htmlFor="radius">Raio (km)</Label>
              <Input
                id="radius"
                type="number"
                min={1}
                max={500}
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-foreground">Segmentos</h2>
              <label className="flex items-center gap-2 text-xs font-medium text-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={allSegments}
                  onChange={(e) => setAllSegments(e.target.checked)}
                  className="rounded border-border"
                />
                Todos os segmentos
              </label>
            </div>
            <div className={`grid sm:grid-cols-3 gap-2 ${allSegments ? "opacity-40 pointer-events-none" : ""}`}>
              {settings.segmentos_disponiveis.map((segment) => (
                <label
                  key={segment}
                  className="flex items-center gap-2 text-sm text-foreground rounded-lg border border-border px-3 py-2 cursor-pointer hover:bg-slate-100"
                >
                  <input
                    type="checkbox"
                    checked={segments.includes(segment)}
                    onChange={() => toggleSegment(segment)}
                    className="rounded border-border"
                  />
                  {segment}
                </label>
              ))}
            </div>
          </div>

          <div className="max-w-xs">
            <Label htmlFor="quantity">Quantidade de empresas</Label>
            <Input
              id="quantity"
              type="number"
              min={1}
              max={200}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
          </div>

          {error && <p className="text-sm text-danger-500">{error}</p>}

          <Button type="submit" size="lg" variant="accent" className="w-full" disabled={loading}>
            {loading ? "Gerando prospecção..." : "GERAR PROSPECÇÃO"}
          </Button>
        </form>

        {result && (
          <div className="mt-6 rounded-xl border border-success-500/30 bg-success-100/40 p-4">
            <p className="text-sm font-semibold text-foreground">
              Prospecção concluída via {result.providerName}
              {result.usingDemoData && " (dados de demonstração)"}
            </p>
            <p className="text-sm text-muted mt-1">
              {result.totalLeads} empresas analisadas · {result.leadsCreated} leads novos ·{" "}
              {result.leadsUpdated} leads atualizados.
            </p>
            <Button size="sm" className="mt-3" onClick={() => router.push("/leads")}>
              Ver leads
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
