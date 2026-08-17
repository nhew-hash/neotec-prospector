// Core domain types for Neotec Prospector.
// These mirror the SQL schema in supabase/migrations/0001_init.sql

export type UserRole = "admin" | "vendedora";
export type UserStatus = "ativo" | "inativo";

export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  phone: string | null;
  status: UserStatus;
  monthly_goal: number; // meta mensal (R$ ou nº vendas, ver settings)
  weekly_goal: number;
  commission_pct: number | null; // override por usuário; se null, usa settings global
  created_at: string;
}

export type PublicUser = Omit<User, "password_hash">;

export type SiteQuality = "excelente" | "bom" | "fraco" | "inexistente";

export interface SiteAnalysis {
  possui_site: boolean;
  site_confiavel: boolean; // se a busca foi suficientemente confiável para afirmar ausência
  acessivel: boolean | null;
  https: boolean | null;
  responsivo: boolean | null;
  aparencia_moderna: boolean | null;
  velocidade_aproximada: "rapida" | "media" | "lenta" | null;
  botao_whatsapp: boolean | null;
  formulario_contato: boolean | null;
  informacoes_empresa: boolean | null;
  cta_claro: boolean | null;
  pagina_servicos: boolean | null;
  seo_basico: boolean | null;
  data_atualizacao_aparente: string | null;
  classificacao: SiteQuality;
  analisado_em: string;
}

export interface Company {
  id: string;
  name: string;
  category: string; // segmento
  city: string;
  state: string;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  google_profile_url: string | null;
  rating: number | null;
  reviews_count: number | null;
  opening_hours: string | null;
  source: string; // fonte do dado
  collected_at: string;
  dedupe_key: string;
  is_demo_data: boolean; // marca dados de demonstração vs. reais
  created_at: string;
  updated_at: string;
}

export type LeadTemperature = "quente" | "morno" | "frio";

export type LeadStatus =
  | "novo"
  | "contato_realizado"
  | "nao_atendeu"
  | "retornar_depois"
  | "interessado"
  | "proposta_enviada"
  | "negociacao"
  | "venda_fechada"
  | "sem_interesse"
  | "numero_invalido";

export interface ScoreBreakdownItem {
  key: string;
  label: string;
  points: number;
}

export interface LeadScore {
  id: string;
  lead_id: string;
  score: number;
  breakdown: ScoreBreakdownItem[];
  temperature: LeadTemperature;
  computed_at: string;
}

export interface Lead {
  id: string;
  company_id: string;
  search_id: string | null;
  segment: string;
  score: number;
  temperature: LeadTemperature;
  status: LeadStatus;
  assigned_to: string | null; // user id (vendedora)
  site_analysis: SiteAnalysis;
  reasons: string[]; // motivos da oportunidade
  approach_suggestion: string;
  created_at: string;
  updated_at: string;
}

export interface LeadSource {
  id: string;
  company_id: string;
  search_id: string | null;
  source_name: string;
  source_ref: string | null;
  created_at: string;
}

export type ContactType = "ligacao" | "whatsapp" | "email" | "outro";
export type ContactResult =
  | "sem_resposta"
  | "atendeu"
  | "numero_invalido"
  | "interessado"
  | "sem_interesse";

export interface LeadContact {
  id: string;
  lead_id: string;
  user_id: string;
  contact_type: ContactType;
  result: ContactResult;
  notes: string | null;
  created_at: string;
}

export interface LeadNote {
  id: string;
  lead_id: string;
  user_id: string;
  note: string;
  created_at: string;
}

export interface LeadFollowup {
  id: string;
  lead_id: string;
  user_id: string;
  next_contact_date: string; // YYYY-MM-DD
  next_contact_time: string | null; // HH:mm
  observation: string | null;
  done: boolean;
  created_at: string;
}

export interface LeadStatusHistory {
  id: string;
  lead_id: string;
  from_status: LeadStatus | null;
  to_status: LeadStatus;
  changed_by: string;
  created_at: string;
}

export interface Sale {
  id: string;
  lead_id: string;
  user_id: string;
  product: string;
  amount: number;
  closed_at: string;
  created_at: string;
}

export interface Commission {
  id: string;
  sale_id: string;
  user_id: string;
  pct: number;
  amount: number;
  created_at: string;
}

export type ProspectingStatus = "concluida" | "em_andamento" | "erro";

export interface ProspectingSearch {
  id: string;
  city: string;
  state: string;
  radius_km: number;
  segments: string[];
  quantity_requested: number;
  quantity_found: number;
  status: ProspectingStatus;
  created_by: string;
  created_at: string;
}

export interface ScoreWeightsConfig {
  sem_site: number;
  google_profile_ativo: number;
  muitas_avaliacoes: number;
  muitas_avaliacoes_threshold: number;
  instagram_ativo: number;
  telefone_whatsapp: number;
  operacao_estabelecida: number;
  segmento_alta_necessidade: number;
  presenca_fraca: number;
}

export interface AppSettings {
  id: string; // singleton "default"
  score_weights: ScoreWeightsConfig;
  score_quente_min: number;
  score_morno_min: number;
  segmentos_alta_necessidade: string[];
  segmentos_disponiveis: string[];
  cidades_sugeridas: string[];
  raio_padrao_km: number;
  quantidade_padrao: number;
  comissao_pct_padrao: number;
  valor_venda_padrao: number;
  status_disponiveis: LeadStatus[];
  updated_at: string;
}

// -------- Composed view types (used by UI) --------

export interface LeadWithCompany extends Lead {
  company: Company;
}

export interface LeadDetail extends LeadWithCompany {
  notes: LeadNote[];
  followups: LeadFollowup[];
  status_history: LeadStatusHistory[];
  contacts: LeadContact[];
  assigned_user: PublicUser | null;
}

export interface FunnelCounts {
  encontrados: number;
  contatados: number;
  interessados: number;
  propostas: number;
  vendas: number;
}

export interface DashboardStats {
  leads_encontrados: number;
  leads_quentes: number;
  leads_para_ligar_hoje: number;
  propostas: number;
  vendas: number;
  valor_vendido: number;
  funil: FunnelCounts;
  followups_hoje: (LeadFollowup & { lead: LeadWithCompany })[];
}
