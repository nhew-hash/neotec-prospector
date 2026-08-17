-- Neotec Prospector — initial schema
-- Run this in the Supabase SQL editor (or via `supabase db push`) once you
-- have a project. Until then, the app runs fine against the built-in local
-- JSON store (see src/lib/db).

create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  password_hash text not null,
  role text not null check (role in ('admin', 'vendedora')),
  phone text,
  status text not null default 'ativo' check (status in ('ativo', 'inativo')),
  monthly_goal numeric not null default 0,
  weekly_goal numeric not null default 0,
  commission_pct numeric,
  created_at timestamptz not null default now()
);

create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  city text not null,
  state text not null,
  address text,
  phone text,
  whatsapp text,
  website text,
  instagram text,
  facebook text,
  google_profile_url text,
  rating numeric,
  reviews_count integer,
  opening_hours text,
  source text not null,
  collected_at timestamptz not null default now(),
  dedupe_key text not null,
  is_demo_data boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_companies_dedupe_key on companies (dedupe_key);
create index if not exists idx_companies_city_state on companies (city, state);

create table if not exists prospecting_searches (
  id uuid primary key default gen_random_uuid(),
  city text not null,
  state text not null,
  radius_km integer not null,
  segments text[] not null default '{}',
  quantity_requested integer not null,
  quantity_found integer not null default 0,
  status text not null default 'em_andamento' check (status in ('concluida', 'em_andamento', 'erro')),
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  search_id uuid references prospecting_searches(id),
  segment text not null,
  score integer not null default 0,
  temperature text not null default 'frio' check (temperature in ('quente', 'morno', 'frio')),
  status text not null default 'novo',
  assigned_to uuid references users(id),
  site_analysis jsonb not null default '{}'::jsonb,
  reasons jsonb not null default '[]'::jsonb,
  approach_suggestion text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id)
);
create index if not exists idx_leads_score on leads (score desc);
create index if not exists idx_leads_status on leads (status);
create index if not exists idx_leads_assigned_to on leads (assigned_to);

create table if not exists lead_sources (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  search_id uuid references prospecting_searches(id),
  source_name text not null,
  source_ref text,
  created_at timestamptz not null default now()
);

create table if not exists lead_scores (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  score integer not null,
  breakdown jsonb not null default '[]'::jsonb,
  temperature text not null,
  computed_at timestamptz not null default now()
);

create table if not exists lead_contacts (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  user_id uuid references users(id),
  contact_type text not null check (contact_type in ('ligacao', 'whatsapp', 'email', 'outro')),
  result text not null check (result in ('sem_resposta', 'atendeu', 'numero_invalido', 'interessado', 'sem_interesse')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists lead_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  user_id uuid references users(id),
  note text not null,
  created_at timestamptz not null default now()
);

create table if not exists lead_followups (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  user_id uuid references users(id),
  next_contact_date date not null,
  next_contact_time time,
  observation text,
  done boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_followups_date on lead_followups (next_contact_date);

create table if not exists lead_status_history (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by uuid references users(id),
  created_at timestamptz not null default now()
);

create table if not exists sales (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  user_id uuid references users(id),
  product text not null,
  amount numeric not null,
  closed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists commissions (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references sales(id) on delete cascade,
  user_id uuid references users(id),
  pct numeric not null,
  amount numeric not null,
  created_at timestamptz not null default now()
);

create table if not exists app_settings (
  id text primary key default 'default',
  score_weights jsonb not null,
  score_quente_min integer not null default 80,
  score_morno_min integer not null default 60,
  segmentos_alta_necessidade text[] not null default '{}',
  segmentos_disponiveis text[] not null default '{}',
  cidades_sugeridas text[] not null default '{}',
  raio_padrao_km integer not null default 50,
  quantidade_padrao integer not null default 50,
  comissao_pct_padrao numeric not null default 10,
  valor_venda_padrao numeric not null default 1497,
  status_disponiveis text[] not null default '{}',
  updated_at timestamptz not null default now()
);

-- Row Level Security: enable and restrict to service-role only for now.
-- All writes in this app go through server-side API routes using the
-- service role key, so authenticated end-user policies are not required
-- yet. Tighten these once end users query Supabase directly (e.g. from a
-- future mobile client).
alter table users enable row level security;
alter table companies enable row level security;
alter table prospecting_searches enable row level security;
alter table leads enable row level security;
alter table lead_sources enable row level security;
alter table lead_scores enable row level security;
alter table lead_contacts enable row level security;
alter table lead_notes enable row level security;
alter table lead_followups enable row level security;
alter table lead_status_history enable row level security;
alter table sales enable row level security;
alter table commissions enable row level security;
alter table app_settings enable row level security;
