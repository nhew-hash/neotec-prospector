import type { RawCompany } from "@/lib/data-providers/types";
import type { SiteAnalysis } from "@/types";

/**
 * Generates a short, natural, non-spammy phone-approach suggestion,
 * personalized per company. Vendedora name defaults to a placeholder that
 * can be swapped per logged-in user in the future.
 */
export function generateApproach(
  company: RawCompany,
  site: SiteAnalysis,
  sellerName = "Ana"
): string {
  const opening = `Olá, tudo bem? Falo com o responsável pela ${company.name}? Meu nome é ${sellerName}, sou da Neotec.`;
  const intro = "Nós trabalhamos com criação de sites para empresas da região.";

  let observation: string;
  if (!site.possui_site) {
    const signal = company.google_profile_url
      ? "vocês têm uma presença forte no Google"
      : company.instagram
      ? "vocês têm uma boa presença no Instagram"
      : "vocês têm uma boa reputação na região";
    observation = `Eu encontrei a empresa de vocês pesquisando ${company.category.toLowerCase()} na região e percebi que ${signal}, mas não encontrei um site próprio.`;
  } else if (site.classificacao === "fraco") {
    observation = `Eu encontrei o site de vocês, mas percebi que ele está um pouco desatualizado e pode não estar convertendo visitantes em clientes como poderia.`;
  } else {
    observation = `Eu encontrei a empresa de vocês pesquisando ${company.category.toLowerCase()} na região e vi que vocês têm uma presença bem interessante online.`;
  }

  const closing = "Posso te explicar rapidamente uma oportunidade que identificamos?";

  return `"${opening} ${intro} ${observation} ${closing}"`;
}
