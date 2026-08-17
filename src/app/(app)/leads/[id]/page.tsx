import { notFound } from "next/navigation";
import { getLeadDetail } from "@/lib/repository/leads";
import { getSettings } from "@/lib/settings";
import { ScoreBadge } from "@/components/leads/ScoreBadge";
import { TemperatureBadge } from "@/components/leads/TemperatureBadge";
import { StatusBadge } from "@/components/leads/StatusBadge";
import { StatusControl } from "@/components/leads/StatusControl";
import { ApproachBox } from "@/components/leads/ApproachBox";
import { NotesSection } from "@/components/leads/NotesSection";
import { FollowupSection } from "@/components/leads/FollowupSection";
import { SendToCrmButton } from "@/components/leads/SendToCrmButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { SITE_QUALITY_LABELS } from "@/lib/analysis/site-analyzer";
import { formatDateTimeBR } from "@/lib/utils/format";
import { STATUS_LABELS } from "@/lib/config/default-settings";

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="text-sm text-foreground font-medium break-words">{value || "Não encontrado"}</p>
    </div>
  );
}

function PresenceRow({ label, ok, extra }: { label: string; ok: boolean | null; extra?: string }) {
  return (
    <div className="flex items-center justify-between text-sm py-1.5">
      <span className="text-muted">{label}</span>
      <span className="font-medium text-foreground">
        {ok === null ? "—" : ok ? "✅ Encontrado" : "❌ Não encontrado"} {extra}
      </span>
    </div>
  );
}

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [lead, settings] = await Promise.all([getLeadDetail(id), getSettings()]);
  if (!lead) notFound();

  const { company, site_analysis: site } = lead;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{company.name}</h1>
          <p className="text-sm text-muted mt-1">
            {lead.segment} · {company.city}/{company.state}
            {company.is_demo_data && " · Dados de demonstração"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ScoreBadge score={lead.score} size="lg" />
          <div>
            <TemperatureBadge temperature={lead.temperature} />
            <div className="mt-1">
              <StatusBadge status={lead.status} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Empresa</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 grid sm:grid-cols-2 gap-4">
              <Field label="Nome" value={company.name} />
              <Field label="Segmento" value={lead.segment} />
              <Field label="Cidade" value={`${company.city}/${company.state}`} />
              <Field label="Endereço" value={company.address} />
              <Field label="Telefone" value={company.phone} />
              <Field label="WhatsApp" value={company.whatsapp} />
              <Field label="Site" value={company.website} />
              <Field label="Instagram" value={company.instagram} />
              <Field label="Facebook" value={company.facebook} />
              <Field label="Google" value={company.google_profile_url} />
              <Field label="Horário de funcionamento" value={company.opening_hours} />
              <Field label="Fonte" value={company.source} />
              <Field label="Data da coleta" value={formatDateTimeBR(company.collected_at)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Presença digital</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="mb-3 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-foreground">
                Classificação do site: {SITE_QUALITY_LABELS[site.classificacao]}
              </div>
              <div className="divide-y divide-border">
                <PresenceRow label="Site" ok={site.possui_site} />
                <PresenceRow label="Instagram" ok={Boolean(company.instagram)} />
                <PresenceRow label="Google Business Profile" ok={Boolean(company.google_profile_url)} />
                <PresenceRow
                  label="Avaliação"
                  ok={company.rating !== null}
                  extra={company.rating ? `(${company.rating})` : ""}
                />
                <PresenceRow
                  label="Avaliações"
                  ok={(company.reviews_count ?? 0) > 0}
                  extra={company.reviews_count ? `(${company.reviews_count})` : ""}
                />
                {site.possui_site && (
                  <>
                    <PresenceRow label="HTTPS" ok={site.https} />
                    <PresenceRow label="Responsivo" ok={site.responsivo} />
                    <PresenceRow label="Botão WhatsApp" ok={site.botao_whatsapp} />
                    <PresenceRow label="Formulário de contato" ok={site.formulario_contato} />
                    <PresenceRow label="Página de serviços" ok={site.pagina_servicos} />
                    <PresenceRow label="SEO básico" ok={site.seo_basico} />
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Score</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex items-center gap-4">
                <ScoreBadge score={lead.score} size="lg" />
                <TemperatureBadge temperature={lead.temperature} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Por que esse cliente é uma oportunidade?</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <ul className="space-y-2">
                {lead.reasons.map((reason, i) => (
                  <li key={i} className="flex gap-2 text-sm text-foreground">
                    <span className="text-brand-500">•</span>
                    {reason}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <ApproachBox text={lead.approach_suggestion} whatsapp={company.whatsapp} />

          <NotesSection leadId={lead.id} notes={lead.notes} />
          <FollowupSection leadId={lead.id} followups={lead.followups} />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Controle da venda</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <StatusControl leadId={lead.id} currentStatus={lead.status} statuses={settings.status_disponiveis} />
              <div className="pt-3 border-t border-border">
                <p className="text-xs text-muted mb-1">Responsável</p>
                <p className="text-sm font-medium text-foreground">
                  {lead.assigned_user?.name ?? "Ainda não atribuído"}
                </p>
              </div>
              <SendToCrmButton leadId={lead.id} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Histórico de status</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {lead.status_history.length === 0 ? (
                <p className="text-sm text-muted">Sem alterações registradas ainda.</p>
              ) : (
                <ul className="space-y-3">
                  {lead.status_history.map((h) => (
                    <li key={h.id} className="text-sm">
                      <p className="text-foreground">
                        {h.from_status ? `${STATUS_LABELS[h.from_status] ?? h.from_status} → ` : ""}
                        {STATUS_LABELS[h.to_status] ?? h.to_status}
                      </p>
                      <p className="text-xs text-muted">{formatDateTimeBR(h.created_at)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
