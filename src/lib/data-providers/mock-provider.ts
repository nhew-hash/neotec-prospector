import type { DataProvider, ProspectingParams, RawCompany } from "./types";
import { SEGMENTOS_ALTA_NECESSIDADE } from "@/lib/config/default-settings";

// Demo data provider. It produces plausible-looking Brazilian small
// business records so the whole product (search -> analysis -> score ->
// leads -> dashboard) can be exercised end to end with zero external
// credentials. Every record is explicitly flagged `is_demo_data: true`
// and the UI must always show a "dados de demonstração" indicator for
// these — this provider never claims to represent real companies.
//
// Swap for GooglePlacesProvider (or another real source) in
// src/lib/data-providers/index.ts once credentials are available.

const NAME_PREFIXES: Record<string, string[]> = {
  Restaurantes: ["Restaurante", "Sabor", "Cantina", "Espaço Gastronômico"],
  Clínicas: ["Clínica", "Centro Médico", "Instituto"],
  Dentistas: ["Clínica Odontológica", "Odonto", "Sorriso"],
  Advogados: ["Escritório de Advocacia", "Advocacia"],
  Contadores: ["Contabilidade", "Escritório Contábil"],
  Imobiliárias: ["Imobiliária", "Imóveis"],
  Oficinas: ["Oficina", "Auto Reparos"],
  "Auto centers": ["Auto Center", "Centro Automotivo"],
  Academias: ["Academia", "Studio Fitness"],
  "Salões de beleza": ["Salão", "Espaço Beleza"],
  Barbearias: ["Barbearia"],
  Lojas: ["Loja", "Comércio"],
  Construção: ["Construtora", "Engenharia"],
  Elétrica: ["Elétrica", "Instalações Elétricas"],
  Refrigeração: ["Refrigeração", "Climatização"],
  "Empresas de serviços": ["Serviços", "Assistência"],
  Hotéis: ["Hotel"],
  Pousadas: ["Pousada"],
  Escolas: ["Escola", "Colégio"],
  Cursos: ["Curso", "Escola Profissionalizante"],
  Transportadoras: ["Transportadora", "Logística"],
  Indústrias: ["Indústria", "Metalúrgica"],
  Outros: ["Empresa"],
};

const NAME_SUFFIXES = [
  "Central",
  "Premium",
  "Express",
  "& Filhos",
  "do Centro",
  "da Cidade",
  "Ltda",
  "Norte",
  "Sul",
  "Elite",
  "Master",
  "",
  "",
];

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

const STREETS = ["Rua das Flores", "Av. Brasil", "Rua XV de Novembro", "Av. Getúlio Vargas", "Rua Goiás", "Rua Minas Gerais", "Av. Rio Branco"];

export class MockDataProvider implements DataProvider {
  name = "Dados de demonstração (mock)";

  isConfigured(): boolean {
    return true;
  }

  async searchCompanies(params: ProspectingParams): Promise<RawCompany[]> {
    const segments =
      !params.segments.length || params.segments.includes("Todos os segmentos")
        ? Object.keys(NAME_PREFIXES)
        : params.segments;

    const seedKey = `${params.city}|${params.state}|${segments.join(",")}|${params.quantity}`;
    const rand = seededRandom(hashString(seedKey));

    const results: RawCompany[] = [];
    for (let i = 0; i < params.quantity; i++) {
      const segment = segments[Math.floor(rand() * segments.length)];
      const prefixes = NAME_PREFIXES[segment] ?? NAME_PREFIXES.Outros;
      const prefix = prefixes[Math.floor(rand() * prefixes.length)];
      const suffix = NAME_SUFFIXES[Math.floor(rand() * NAME_SUFFIXES.length)];
      const name = `${prefix} ${cityWord(params.city)}${suffix ? " " + suffix : ""} ${i + 1}`;

      const hasWebsite = rand() < 0.35; // most small businesses in the demo lack a site
      const hasGoogle = rand() < 0.8;
      const hasInstagram = rand() < 0.55;
      const hasWhatsapp = rand() < 0.75;
      const reviewsCount = hasGoogle ? Math.floor(rand() * 260) : 0;
      const rating = hasGoogle ? Math.round((3.2 + rand() * 1.8) * 10) / 10 : null;
      const phoneDigits = `34${String(Math.floor(3000 + rand() * 6999))}${String(Math.floor(1000 + rand() * 8999))}`;

      results.push({
        name,
        category: segment,
        city: params.city,
        state: params.state,
        address: `${STREETS[Math.floor(rand() * STREETS.length)]}, ${Math.floor(
          100 + rand() * 2400
        )} - ${params.city}/${params.state}`,
        phone: `(${phoneDigits.slice(0, 2)}) ${phoneDigits.slice(2, 6)}-${phoneDigits.slice(6)}`,
        whatsapp: hasWhatsapp ? `(${phoneDigits.slice(0, 2)}) 9${phoneDigits.slice(2, 6)}-${phoneDigits.slice(6)}` : null,
        website: hasWebsite ? `https://www.${slugify(name)}.com.br` : null,
        instagram: hasInstagram ? `https://instagram.com/${slugify(name)}` : null,
        facebook: rand() < 0.3 ? `https://facebook.com/${slugify(name)}` : null,
        google_profile_url: hasGoogle ? `https://maps.google.com/?q=${encodeURIComponent(name)}` : null,
        rating,
        reviews_count: reviewsCount,
        opening_hours: rand() < 0.6 ? "Seg-Sex 08:00-18:00, Sáb 08:00-12:00" : null,
        source: this.name,
        source_reliable: true,
        is_demo_data: true,
      });
    }
    return results;
  }
}

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 24);
}

function cityWord(city: string): string {
  return city.split(/[\s-]/)[0] || city;
}

// Exported for reuse by the score engine when weighting "segmento de alta necessidade".
export const isHighNeedSegment = (segment: string) => SEGMENTOS_ALTA_NECESSIDADE.includes(segment);
