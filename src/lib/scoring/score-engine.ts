import type { RawCompany } from "@/lib/data-providers/types";
import type { AppSettings, LeadTemperature, ScoreBreakdownItem, SiteAnalysis } from "@/types";

export interface ScoreResult {
  score: number;
  breakdown: ScoreBreakdownItem[];
  temperature: LeadTemperature;
}

/**
 * Configurable opportunity score (0-100). Weights come from AppSettings so
 * an admin can tune the algorithm from Configurações without touching code.
 */
export function computeScore(
  company: RawCompany,
  site: SiteAnalysis,
  settings: AppSettings
): ScoreResult {
  const w = settings.score_weights;
  const breakdown: ScoreBreakdownItem[] = [];

  if (!site.possui_site) {
    breakdown.push({ key: "sem_site", label: "Empresa não possui site", points: w.sem_site });
  } else if (site.classificacao === "fraco") {
    breakdown.push({
      key: "presenca_fraca",
      label: "Possui site, mas a presença digital é claramente fraca",
      points: w.presenca_fraca,
    });
  }

  if (company.google_profile_url) {
    breakdown.push({
      key: "google_profile_ativo",
      label: "Possui Google Business Profile ativo",
      points: w.google_profile_ativo,
    });
  }

  if ((company.reviews_count ?? 0) >= w.muitas_avaliacoes_threshold) {
    breakdown.push({
      key: "muitas_avaliacoes",
      label: `Possui ${company.reviews_count} avaliações no Google`,
      points: w.muitas_avaliacoes,
    });
  }

  if (company.instagram) {
    breakdown.push({
      key: "instagram_ativo",
      label: "Possui Instagram ativo",
      points: w.instagram_ativo,
    });
  }

  if (company.phone || company.whatsapp) {
    breakdown.push({
      key: "telefone_whatsapp",
      label: "Possui telefone/WhatsApp para contato",
      points: w.telefone_whatsapp,
    });
  }

  const estabelecida =
    (company.reviews_count ?? 0) >= 15 || Boolean(company.opening_hours) || (company.rating ?? 0) >= 4;
  if (estabelecida) {
    breakdown.push({
      key: "operacao_estabelecida",
      label: "Empresa aparenta ter operação estabelecida",
      points: w.operacao_estabelecida,
    });
  }

  if (settings.segmentos_alta_necessidade.includes(company.category)) {
    breakdown.push({
      key: "segmento_alta_necessidade",
      label: `Segmento "${company.category}" tem alta necessidade de presença digital`,
      points: w.segmento_alta_necessidade,
    });
  }

  const rawScore = breakdown.reduce((sum, item) => sum + item.points, 0);
  const score = Math.max(0, Math.min(100, rawScore));

  let temperature: LeadTemperature = "frio";
  if (score >= settings.score_quente_min) temperature = "quente";
  else if (score >= settings.score_morno_min) temperature = "morno";

  return { score, breakdown, temperature };
}

export const TEMPERATURE_LABELS: Record<LeadTemperature, string> = {
  quente: "🔥 Lead quente",
  morno: "🟡 Lead morno",
  frio: "⚪ Lead frio",
};
