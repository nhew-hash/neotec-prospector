import type { RawCompany } from "@/lib/data-providers/types";
import type { SiteAnalysis, SiteQuality } from "@/types";

// Analyzes a company's digital presence. When `website` is present and the
// company came from demo data, we derive a consistent, seeded analysis so
// the UI and scoring can be exercised end to end without a live crawl —
// every field on a demo record is fictional anyway, and that's clearly
// flagged (`is_demo_data: true`) in the UI.
//
// For real companies (e.g. from Google Places), we do an actual best-effort
// HTTP check of the site instead of simulating one — see
// `analyzeRealSite()`. Anything we can't verify from the page stays `null`
// (not fabricated) rather than guessed.
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

function noSiteAnalysis(reliable: boolean, now: string): SiteAnalysis {
  return {
    possui_site: false,
    site_confiavel: reliable,
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

function classify(acessivel: boolean, positives: number): SiteQuality {
  if (!acessivel) return "fraco";
  if (positives >= 8) return "excelente";
  if (positives >= 5) return "bom";
  return "fraco";
}

// Best-effort real analysis: fetches the page HTML (bounded in size and
// time) and looks for concrete, verifiable signals. No visual/AI judgment
// is made — every signal here is a literal, checkable fact about the HTML
// or the HTTP response. Anything we can't check this way (e.g. true visual
// "modernidade") is left `null` instead of guessed.
const FETCH_TIMEOUT_MS = 8000;
const MAX_BYTES = 300_000; // cap how much HTML we read, small business sites are tiny

async function fetchHtmlCapped(url: string): Promise<{ ok: boolean; finalUrl: string; html: string; ms: number }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  const started = Date.now();
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; NeotecProspectorBot/1.0; +https://neotec-prospector.vercel.app)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    const ms = Date.now() - started;
    if (!res.ok) {
      return { ok: false, finalUrl: res.url || url, html: "", ms };
    }
    const reader = res.body?.getReader();
    if (!reader) {
      const text = await res.text();
      return { ok: true, finalUrl: res.url || url, html: text.slice(0, MAX_BYTES), ms };
    }
    const decoder = new TextDecoder("utf-8");
    let html = "";
    let bytes = 0;
    while (bytes < MAX_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      html += decoder.decode(value, { stream: true });
    }
    reader.cancel().catch(() => undefined);
    return { ok: true, finalUrl: res.url || url, html, ms };
  } finally {
    clearTimeout(timer);
  }
}

const CTA_PHRASES = [
  "fale conosco",
  "entre em contato",
  "solicite um orçamento",
  "solicite orçamento",
  "peça um orçamento",
  "agende",
  "agende agora",
  "compre agora",
  "saiba mais",
  "faça seu pedido",
  "peça já",
  "reserve",
];

async function analyzeRealSite(website: string, now: string): Promise<SiteAnalysis> {
  let fetched;
  try {
    fetched = await fetchHtmlCapped(website);
  } catch {
    fetched = null;
  }

  if (!fetched || !fetched.ok) {
    return {
      possui_site: true,
      site_confiavel: true,
      acessivel: false,
      https: website.startsWith("https://"),
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
      classificacao: "fraco",
      analisado_em: now,
    };
  }

  const { finalUrl, html, ms } = fetched;
  const lower = html.toLowerCase();

  const https = finalUrl.startsWith("https://");
  const responsivo = /<meta[^>]+name=["']viewport["']/i.test(html);
  const botaoWhatsapp = /(wa\.me\/|api\.whatsapp\.com|web\.whatsapp\.com)/i.test(html);
  const formularioContato = /<form[\s>]/i.test(html);
  const temTelefoneOuEmail = /(tel:|mailto:)/i.test(html);
  const temPalavrasContato = /(cnpj|endereço|nosso endereço|onde estamos|fale conosco)/i.test(lower);
  const informacoesEmpresa = formularioContato || temTelefoneOuEmail || temPalavrasContato;
  const ctaClaro = CTA_PHRASES.some((phrase) => lower.includes(phrase));
  const paginaServicos = /(servi[cç]os|produtos|about|sobre[- ]n[oó]s)/i.test(lower);

  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']{5,})["']/i);
  const seoBasico = Boolean(titleMatch?.[1]?.trim()) && Boolean(descMatch?.[1]?.trim());

  // Approximate "modern appearance" from concrete, checkable signals only
  // (mobile-friendly + a real contact/CTA setup) rather than a visual
  // judgment we can't actually make from raw HTML — never a guess.
  const aparenciaModerna = responsivo && (ctaClaro || formularioContato);

  const velocidade: SiteAnalysis["velocidade_aproximada"] = ms < 800 ? "rapida" : ms < 2500 ? "media" : "lenta";

  const yearMatch = html.match(/(?:©|copyright)\D{0,10}(\d{4})/i);
  const dataAtualizacaoAparente = yearMatch ? yearMatch[1] : null;

  const positives = [
    https,
    true, // acessivel
    responsivo,
    aparenciaModerna,
    botaoWhatsapp,
    formularioContato,
    informacoesEmpresa,
    ctaClaro,
    paginaServicos,
    seoBasico,
  ].filter(Boolean).length;

  return {
    possui_site: true,
    site_confiavel: true,
    acessivel: true,
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
    data_atualizacao_aparente: dataAtualizacaoAparente,
    classificacao: classify(true, positives),
    analisado_em: now,
  };
}

function analyzeDemoSite(website: string, now: string): SiteAnalysis {
  const rand = seededRandom(hashString(website));
  const https = website.startsWith("https://") || rand() < 0.7;
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
    classificacao: classify(acessivel, positives),
    analisado_em: now,
  };
}

export async function analyzeSite(company: RawCompany): Promise<SiteAnalysis> {
  const now = new Date().toISOString();

  if (!company.website) {
    return noSiteAnalysis(company.source_reliable, now);
  }

  if (company.is_demo_data) {
    return analyzeDemoSite(company.website, now);
  }

  return analyzeRealSite(company.website, now);
}

export const SITE_QUALITY_LABELS: Record<SiteQuality, string> = {
  excelente: "Excelente — site moderno e bem estruturado",
  bom: "Bom — site funcional, mas com oportunidades",
  fraco: "Fraco — site antigo ou pouco funcional",
  inexistente: "Inexistente — nenhum site encontrado",
};
