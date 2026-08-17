"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { ScoreBadge } from "./ScoreBadge";
import { TemperatureBadge } from "./TemperatureBadge";
import { StatusBadge } from "./StatusBadge";
import { STATUS_LABELS } from "@/lib/config/default-settings";
import type { AppSettings, LeadStatus, LeadTemperature, LeadWithCompany, PublicUser } from "@/types";

interface Props {
  leads: LeadWithCompany[];
  settings: AppSettings;
  vendedoras: PublicUser[];
  initialQuickFilter?: "melhores" | "sem_site" | null;
}

export function LeadsTable({ leads, settings, vendedoras, initialQuickFilter = null }: Props) {
  const [city, setCity] = useState("");
  const [segment, setSegment] = useState("");
  const [minScore, setMinScore] = useState(0);
  const [temperature, setTemperature] = useState<LeadTemperature | "">("");
  const [hasWebsite, setHasWebsite] = useState<"" | "sim" | "nao">(
    initialQuickFilter === "sem_site" ? "nao" : ""
  );
  const [hasWhatsapp, setHasWhatsapp] = useState<"" | "sim" | "nao">("");
  const [status, setStatus] = useState<LeadStatus | "">("");
  const [assignedTo, setAssignedTo] = useState("");
  const [quickBest, setQuickBest] = useState(initialQuickFilter === "melhores");

  const cities = useMemo(() => Array.from(new Set(leads.map((l) => l.company.city))).sort(), [leads]);

  const filtered = useMemo(() => {
    let result = leads;
    if (city) result = result.filter((l) => l.company.city === city);
    if (segment) result = result.filter((l) => l.segment === segment);
    if (minScore) result = result.filter((l) => l.score >= minScore);
    if (temperature) result = result.filter((l) => l.temperature === temperature);
    if (hasWebsite) result = result.filter((l) => l.site_analysis.possui_site === (hasWebsite === "sim"));
    if (hasWhatsapp) result = result.filter((l) => Boolean(l.company.whatsapp) === (hasWhatsapp === "sim"));
    if (status) result = result.filter((l) => l.status === status);
    if (assignedTo) result = result.filter((l) => l.assigned_to === assignedTo);

    if (quickBest) {
      result = [...result].sort((a, b) => {
        const aNoSite = a.site_analysis.possui_site ? 0 : 1;
        const bNoSite = b.site_analysis.possui_site ? 0 : 1;
        if (aNoSite !== bNoSite) return bNoSite - aNoSite;
        return b.score - a.score;
      });
    } else {
      result = [...result].sort((a, b) => b.score - a.score);
    }
    return result;
  }, [leads, city, segment, minScore, temperature, hasWebsite, hasWhatsapp, status, assignedTo, quickBest]);

  const exportUrl = (format: "csv" | "xlsx") => {
    const params = new URLSearchParams({ format });
    if (city) params.set("city", city);
    if (segment) params.set("segment", segment);
    if (minScore) params.set("minScore", String(minScore));
    if (temperature) params.set("temperature", temperature);
    if (hasWebsite) params.set("hasWebsite", hasWebsite);
    if (hasWhatsapp) params.set("hasWhatsapp", hasWhatsapp);
    if (status) params.set("status", status);
    if (assignedTo) params.set("assignedTo", assignedTo);
    return `/api/leads/export?${params.toString()}`;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-5">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Button
              size="sm"
              variant={quickBest ? "accent" : "secondary"}
              onClick={() => setQuickBest((v) => !v)}
            >
              🔥 Melhores oportunidades
            </Button>
            <Button
              size="sm"
              variant={hasWebsite === "nao" ? "accent" : "secondary"}
              onClick={() => setHasWebsite((v) => (v === "nao" ? "" : "nao"))}
            >
              Empresas SEM SITE
            </Button>
            {(city || segment || minScore > 0 || temperature || hasWebsite || hasWhatsapp || status || assignedTo) && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setCity("");
                  setSegment("");
                  setMinScore(0);
                  setTemperature("");
                  setHasWebsite("");
                  setHasWhatsapp("");
                  setStatus("");
                  setAssignedTo("");
                }}
              >
                Limpar filtros
              </Button>
            )}
            <div className="ml-auto flex gap-2">
              <a href={exportUrl("csv")}>
                <Button size="sm" variant="secondary">
                  Exportar CSV
                </Button>
              </a>
              <a href={exportUrl("xlsx")}>
                <Button size="sm" variant="secondary">
                  Exportar Excel
                </Button>
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            <div>
              <Label>Cidade</Label>
              <Select value={city} onChange={(e) => setCity(e.target.value)}>
                <option value="">Todas</option>
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Segmento</Label>
              <Select value={segment} onChange={(e) => setSegment(e.target.value)}>
                <option value="">Todos</option>
                {settings.segmentos_disponiveis.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Score mínimo</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
              />
            </div>
            <div>
              <Label>Temperatura</Label>
              <Select value={temperature} onChange={(e) => setTemperature(e.target.value as LeadTemperature | "")}>
                <option value="">Todas</option>
                <option value="quente">🔥 Quente</option>
                <option value="morno">🟡 Morno</option>
                <option value="frio">⚪ Frio</option>
              </Select>
            </div>
            <div>
              <Label>Possui site</Label>
              <Select value={hasWebsite} onChange={(e) => setHasWebsite(e.target.value as "" | "sim" | "nao")}>
                <option value="">Todos</option>
                <option value="sim">Sim</option>
                <option value="nao">Não</option>
              </Select>
            </div>
            <div>
              <Label>Possui WhatsApp</Label>
              <Select value={hasWhatsapp} onChange={(e) => setHasWhatsapp(e.target.value as "" | "sim" | "nao")}>
                <option value="">Todos</option>
                <option value="sim">Sim</option>
                <option value="nao">Não</option>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={status} onChange={(e) => setStatus(e.target.value as LeadStatus | "")}>
                <option value="">Todos</option>
                {settings.status_disponiveis.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s] ?? s}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Vendedora</Label>
              <Select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
                <option value="">Todas</option>
                {vendedoras.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-slate-100/60 text-left text-xs font-semibold text-muted uppercase tracking-wide">
                <th className="px-4 py-3">Empresa</th>
                <th className="px-4 py-3">Segmento</th>
                <th className="px-4 py-3">Cidade</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Site</th>
                <th className="px-4 py-3">WhatsApp</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Vendedora</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => {
                const seller = vendedoras.find((v) => v.id === lead.assigned_to);
                return (
                  <tr key={lead.id} className="border-b border-border last:border-0 hover:bg-slate-100/50">
                    <td className="px-4 py-3">
                      <Link href={`/leads/${lead.id}`} className="font-medium text-foreground hover:text-brand-500">
                        {lead.company.name}
                      </Link>
                      <div className="mt-0.5">
                        <TemperatureBadge temperature={lead.temperature} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted">{lead.segment}</td>
                    <td className="px-4 py-3 text-muted whitespace-nowrap">
                      {lead.company.city}/{lead.company.state}
                    </td>
                    <td className="px-4 py-3">
                      <ScoreBadge score={lead.score} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {lead.site_analysis.possui_site ? "✅ Encontrado" : "❌ Não encontrado"}
                    </td>
                    <td className="px-4 py-3 text-muted">{lead.company.whatsapp ? "✅ Sim" : "Não encontrado"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={lead.status} />
                    </td>
                    <td className="px-4 py-3 text-muted">{seller?.name ?? "—"}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted">
                    Nenhum lead encontrado com os filtros atuais.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="text-xs text-muted">{filtered.length} lead(s) — ordenado por maior score primeiro.</p>
    </div>
  );
}
