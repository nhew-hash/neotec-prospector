import type { AppSettings } from "@/types";

// Default configuration used to seed app_settings and as a fallback.
// Everything here is editable later by an admin on the Configurações page.

export const SEGMENTOS_DISPONIVEIS = [
  "Restaurantes",
  "Clínicas",
  "Dentistas",
  "Advogados",
  "Contadores",
  "Imobiliárias",
  "Oficinas",
  "Auto centers",
  "Academias",
  "Salões de beleza",
  "Barbearias",
  "Lojas",
  "Construção",
  "Elétrica",
  "Refrigeração",
  "Empresas de serviços",
  "Hotéis",
  "Pousadas",
  "Escolas",
  "Cursos",
  "Transportadoras",
  "Indústrias",
  "Outros",
];

// Segments considered to have high need for a strong digital presence —
// used as the +10 "segmento de alta necessidade" score factor.
export const SEGMENTOS_ALTA_NECESSIDADE = [
  "Restaurantes",
  "Clínicas",
  "Dentistas",
  "Advogados",
  "Contadores",
  "Imobiliárias",
  "Academias",
  "Salões de beleza",
  "Barbearias",
  "Hotéis",
  "Pousadas",
  "Empresas de serviços",
];

export const CIDADES_SUGERIDAS = [
  "Araguari - MG",
  "Uberlândia - MG",
  "Patrocínio - MG",
  "Uberaba - MG",
  "Araxá - MG",
];

export const STATUS_DISPONIVEIS: AppSettings["status_disponiveis"] = [
  "novo",
  "contato_realizado",
  "nao_atendeu",
  "retornar_depois",
  "interessado",
  "proposta_enviada",
  "negociacao",
  "venda_fechada",
  "sem_interesse",
  "numero_invalido",
];

export const DEFAULT_SETTINGS: AppSettings = {
  id: "default",
  score_weights: {
    sem_site: 30,
    google_profile_ativo: 15,
    muitas_avaliacoes: 10,
    muitas_avaliacoes_threshold: 30,
    instagram_ativo: 10,
    telefone_whatsapp: 10,
    operacao_estabelecida: 10,
    segmento_alta_necessidade: 10,
    presenca_fraca: 5,
  },
  score_quente_min: 80,
  score_morno_min: 60,
  segmentos_alta_necessidade: SEGMENTOS_ALTA_NECESSIDADE,
  segmentos_disponiveis: SEGMENTOS_DISPONIVEIS,
  cidades_sugeridas: CIDADES_SUGERIDAS,
  raio_padrao_km: 50,
  quantidade_padrao: 50,
  comissao_pct_padrao: 10,
  valor_venda_padrao: 1497,
  status_disponiveis: STATUS_DISPONIVEIS,
  updated_at: new Date().toISOString(),
};

export const STATUS_LABELS: Record<string, string> = {
  novo: "Novo",
  contato_realizado: "Contato realizado",
  nao_atendeu: "Não atendeu",
  retornar_depois: "Retornar depois",
  interessado: "Interessado",
  proposta_enviada: "Proposta enviada",
  negociacao: "Negociação",
  venda_fechada: "Venda fechada",
  sem_interesse: "Sem interesse",
  numero_invalido: "Número inválido",
};
