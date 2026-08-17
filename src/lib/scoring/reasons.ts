import type { RawCompany } from "@/lib/data-providers/types";
import type { ScoreBreakdownItem, SiteAnalysis } from "@/types";

/**
 * Turns the score breakdown + raw signals into the human-readable
 * "Por que esse cliente é uma oportunidade?" list shown to the vendedora.
 */
export function buildReasons(
  company: RawCompany,
  site: SiteAnalysis,
  breakdown: ScoreBreakdownItem[]
): string[] {
  const reasons: string[] = [];

  if (!site.possui_site) {
    reasons.push("Empresa sem site próprio (Site não encontrado).");
  } else if (site.classificacao === "fraco") {
    reasons.push("Possui site, porém desatualizado/pouco funcional — oportunidade de reformulação.");
  }

  if (company.google_profile_url) {
    reasons.push("Possui Google Business Profile ativo.");
  }

  if ((company.reviews_count ?? 0) > 0) {
    reasons.push(`Possui ${company.reviews_count} avaliações no Google.`);
  }

  if (company.instagram) {
    reasons.push("Possui Instagram ativo.");
  }

  if (company.whatsapp) {
    reasons.push("Possui WhatsApp para contato direto.");
  } else if (company.phone) {
    reasons.push("Possui telefone para contato.");
  }

  const hasBreakdown = (key: string) => breakdown.some((b) => b.key === key);
  if (hasBreakdown("operacao_estabelecida")) {
    reasons.push("Empresa aparenta estar estabelecida na região.");
  }
  if (hasBreakdown("segmento_alta_necessidade")) {
    reasons.push(`Segmento "${company.category}" costuma converter bem em sites/landing pages.`);
  }

  reasons.push(
    site.possui_site
      ? "Forte potencial para modernização de site e geração de leads."
      : "Forte potencial para criação de site institucional e geração de leads."
  );

  return reasons;
}
