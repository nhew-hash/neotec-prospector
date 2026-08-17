import type { RawCompany } from "@/lib/data-providers/types";
import type { SiteAnalysis, SiteQuality } from "@/types";

// Analyzes a company's digital presence. When `website` is present and the
// provider is a real one (e.g. Google Places), this is the extension point
// to add real HTTP checks (fetch the page, inspect headers for HTTPS,
// measure response time, look for a viewport meta tag / whatsapp links /
// contact forms, etc). For the demo provider we derive a consistent,
// seeded analysis so the UI and scoring can be fully exercised without a
// live crawl.
//
// IMPORTANT: if the source could not reliably confirm the *absence* of a
// site, `site_confiavel` must be false and the UI must show
// "Site não encontrado" rather than asserting the company has none.

function seededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h) || 1;
}

export async function analyzeSite(company: RawCompany): Promise<SiteAnalysis> {
  const now = new Date().toISOString();

  if (!company.website) {
    return {
      possui_site: false,
      site_confiavel: company.source_reliable,
      acessivel: null,
      https: null,
      responsivo: null,
      aparencia_moderna: null,
      velocidade_aproximada: null,
      botao_whatsapp: null,
      formulario_contato: null,
      informacoes_empresa: null,
      cta_claro: null,
      pagina_servicos: null,
      seo_basico: null,
      data_atualizacao_aparente: null,
      classificacao: "inexistente",
      analisado_em: now,
    };
  }

  // TODO (real integration): replace this seeded heuristic with an actual
  // fetch() of `company.website`, checking response status, TLS, a
  // <meta name="viewport"> tag, presence of "wa.me"/whatsapp links, a
  // <form>, and basic SEO tags (title, meta description, h1).
  const rand = seededRandom(hashString(company.website));
  const https = company.website.startsWith("https://") || rand() < 0.7;
  const acessivel = rand() < 0.92;
  const responsivo = rand() < 0.6;
  const aparenciaModerna = rand() < 0.45;
  const botaoWhatsapp = rand() < 0.4;
  const formularioContato = rand() < 0.5;
  const informacoesEmpresa = rand() < 0.75;
  const ctaClaro = rand() < 0.4;
  const paginaServicos = rand() < 0.55;
  const seoBasico = rand() < 0.35;
  const velocidade: SiteAnalysis["velocidade_aproximada"] =
    rand() < 0.3 ? "lenta" : rand() < 0.7 ? "media" : "rapida";

  const positives = [
    https,
    acessivel,
    responsivo,
    aparenciaModerna,
    botaoWhatsapp,
    formularioContato,
    informacoesEmpresa,
    ctaClaro,
    paginaServicos,
    seoBasico,
  ].filter(Boolean).length;

  let classificacao: SiteQuality;
  if (!acessivel) classificacao = "fraco";
  else if (positives >= 8) classificacao = "excelente";
  else if (positives >= 5) classificacao = "bom";
  else classificacao = "fraco";

  return {
    possui_site: true,
    site_confiavel: true,
    acessivel,
    https,
    responsivo,
    aparencia_moderna: aparenciaModerna,
    velocidade_aproximada: velocidade,
    botao_whatsapp: botaoWhatsapp,
    formulario_contato: formularioContato,
    informacoes_empresa: informacoesEmpresa,
    cta_claro: ctaClaro,
    pagina_servicos: paginaServicos,
    seo_basico: seoBasico,
    data_atualizacao_aparente: null,
    classificacao,
    analisado_em: now,
  };
}

export const SITE_QUALITY_LABELS: Record<SiteQuality, string> = {
  excelente: "Excelente — site moderno e bem estruturado",
  bom: "Bom — site funcional, mas com oportunidades",
  fraco: "Fraco — site antigo ou pouco funcional",
  inexistente: "Inexistente — nenhum site encontrado",
};
