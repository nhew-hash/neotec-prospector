# Neotec Prospector

Sistema de prospecção B2B da Neotec: encontra empresas com potencial de comprar um site,
analisa a presença digital de cada uma, calcula um score de oportunidade e entrega uma
lista priorizada para a equipe comercial ligar. **Poucos leads, mas leads bons.**

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Supabase/PostgreSQL (opcional)

## Rodando localmente (sem nenhuma configuração)

```bash
npm install
npm run dev
```

Abra http://localhost:3000. Faça login com uma das contas de demonstração criadas
automaticamente na primeira execução:

- **Admin:** admin@neotec.com.br / neotec123
- **Vendedora:** ana@neotec.com.br / vendas123

Sem nenhuma variável de ambiente configurada, o sistema roda 100% funcional usando:

- um **banco de dados local em arquivo JSON** (`src/data/local-db.json`, criado
  automaticamente e ignorado pelo git), com a mesma interface que será usada pelo Supabase;
- um **provedor de dados de demonstração** (`MockDataProvider`) que gera empresas
  fictícias, mas plausíveis, sempre marcadas como "dados de demonstração" na interface —
  o sistema nunca inventa dados reais nem afirma tê-los encontrado quando não encontrou.

Isso permite testar o fluxo completo (prospecção → análise → score → leads → dashboard →
follow-up → vendas) sem precisar de nenhuma chave de API.

## Conectando dados e integrações reais

Copie `.env.example` para `.env.local` e preencha apenas o que já tiver — nada é
obrigatório para a V1 funcionar.

### Banco de dados real (Supabase/PostgreSQL)

1. Crie um projeto em https://supabase.com.
2. Rode as migrations em `supabase/migrations/0001_init.sql` (SQL editor do Supabase ou
   `supabase db push`).
3. Defina `NEXT_PUBLIC_SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` no `.env.local`.
4. Reinicie o servidor — o sistema passa a usar o Supabase automaticamente
   (veja `src/lib/db/index.ts`). Nenhuma outra mudança de código é necessária.

### Fonte real de empresas (Google Places)

O sistema nunca inventa empresas, telefones, WhatsApp ou sites. Toda busca passa pela
abstração `DataProvider` (`src/lib/data-providers/`), e o `GooglePlacesProvider`
(`src/lib/data-providers/google-places-provider.ts`) já está implementado usando a
Places API (New) — busca por segmento + cidade/estado, com paginação e sem inventar
campos que o Google não retorna (Instagram, Facebook e WhatsApp continuam sempre
`null`, já que a Places API não fornece isso).

Para ativar:

1. Crie um projeto no [Google Cloud Console](https://console.cloud.google.com/) (ou use
   um existente) e ative a **Places API (New)**.
2. Habilite o faturamento (billing) do projeto — o Google exige isso mesmo para uso
   dentro da cota gratuita mensal.
3. Gere uma chave de API em **APIs e serviços → Credenciais** e, por segurança, restrinja
   essa chave à Places API (New).
4. Defina `GOOGLE_PLACES_API_KEY` no `.env.local` (local) ou nas variáveis de ambiente do
   projeto na Vercel (produção) e faça o redeploy.

Enquanto essa chave não estiver definida, o sistema usa o `MockDataProvider`
automaticamente e deixa isso visível na interface (aviso no topo das telas). Quando um
lead tem site real (fonte Google Places), a análise de presença digital também deixa de
ser simulada: `src/lib/analysis/site-analyzer.ts` faz uma checagem HTTP real do site
(acessibilidade, HTTPS, meta viewport, botão de WhatsApp, formulário de contato, SEO
básico etc.) em vez de gerar dados fictícios — isso só continua simulado para os leads
de demonstração (`is_demo_data: true`).

### Neotec OS (CRM)

O botão "Enviar para CRM" em cada lead está pronto na interface, mas a chamada real
depende de `NEOTEC_OS_API_URL` e `NEOTEC_OS_API_KEY`. Sem essas variáveis, o botão informa
claramente que a integração ainda não está configurada, sem simular sucesso.

### WhatsApp

O botão "Abrir WhatsApp" no card do lead já funciona hoje usando o link público `wa.me`
(sem necessidade de credenciais). Variáveis para a futura API oficial do WhatsApp
Business (`WHATSAPP_API_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`) já estão documentadas no
`.env.example` para quando a integração completa (registrar contato, receber retorno)
for implementada.

## Estrutura do projeto

```
src/
  app/                     # Rotas (App Router)
    (app)/                 # Área autenticada: dashboard, prospecção, leads, empresas, vendedoras, configurações
    api/                   # Route handlers (auth, prospecção, leads, export, settings, users, CRM)
    login/
  components/              # UI (layout, dashboard, leads, ui primitives)
  lib/
    db/                    # Store: interface + implementação local (JSON) + Supabase
    data-providers/        # DataProvider: interface + Mock + Google Places (stub)
    analysis/               # Analisador de presença digital / site
    scoring/                # Algoritmo de score + motivos da oportunidade
    approach/                # Gerador de abordagem de ligação
    dedupe/                  # Detecção de duplicados
    prospecting/              # Orquestração: provider -> análise -> score -> dedupe -> persistência
    repository/               # Camada de acesso a dados por entidade (leads, empresas, vendas, dashboard)
    auth/                     # Sessão (JWT em cookie), usuários, seed de contas demo
    export/                   # Exportação CSV/XLSX
    config/                   # Configuração padrão (pesos do score, segmentos, cidades)
  types/                    # Tipos compartilhados, espelhando o schema SQL
supabase/migrations/         # Schema SQL para Supabase/PostgreSQL
```

## Algoritmo de score

Configurável em **Configurações** (apenas admin) ou diretamente em
`src/lib/config/default-settings.ts`. Pontuação de 0 a 100:

| Sinal | Pontos padrão |
|---|---|
| Empresa não possui site | +30 |
| Google Business Profile ativo | +15 |
| Muitas avaliações (≥30 por padrão) | +10 |
| Instagram ativo | +10 |
| Telefone/WhatsApp | +10 |
| Operação aparenta estabelecida | +10 |
| Segmento de alta necessidade digital | +10 |
| Presença digital fraca (tem site, mas ruim) | +5 |

Classificação: 🔥 Quente (≥80) · 🟡 Morno (≥60) · ⚪ Frio (<60) — limites também configuráveis.

## Deploy (Vercel + Supabase)

> ⚠️ **O banco de dados local (arquivo JSON) só funciona em desenvolvimento local
> (`npm run dev`/`npm run start` na sua máquina).** Vercel — e praticamente qualquer
> plataforma serverless — roda as funções em um sistema de arquivos somente leitura, então
> o modo local não tem onde persistir dados em produção. **O Supabase é obrigatório para
> publicar na Vercel.** Se as variáveis do Supabase não estiverem configuradas lá, o
> sistema mostra um erro claro pedindo para configurá-las, em vez de travar silenciosamente.

1. Configure o projeto Supabase e rode as migrations (veja acima).
2. Publique o repositório na Vercel.
   - **Se o `package.json` estiver dentro de uma subpasta do repositório** (por exemplo,
     porque o zip inteiro foi enviado como está), configure isso em
     **Project Settings → General → Root Directory**, apontando para essa subpasta —
     caso contrário a Vercel não encontra o projeto para buildar e a URL retorna 404.
3. Em Project Settings → Environment Variables, adicione `NEXT_PUBLIC_SUPABASE_URL`,
   `SUPABASE_SERVICE_ROLE_KEY` e `SESSION_SECRET` (gere com `openssl rand -base64 32`).
   Sem as duas primeiras, login e prospecção falham em produção (veja o aviso acima).
4. Rode `supabase/migrations/0002_seed.sql` (ou crie os usuários manualmente) para ter
   contas de login, já que o seed automático de demonstração só roda no banco local.
5. Deploy.

## O que ficou de fora da V1 (de propósito)

Conforme a prioridade do projeto ("qualidade dos leads, não quantidade de funcionalidades"),
não foram implementados nesta primeira versão: edição de segmentos/cidades pela interface
(hoje em `default-settings.ts`), CRUD completo de usuários e WhatsApp Business API oficial
(o botão "Abrir WhatsApp" usa o link público `wa.me`, que já funciona sem credenciais).
