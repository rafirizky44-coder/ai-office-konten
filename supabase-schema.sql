-- AI Office Konten Cuan Digital
-- Supabase PostgreSQL starter schema
-- Jalankan di SQL Editor project Supabase baru. Review sebelum production.

create extension if not exists pgcrypto;

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Konten Cuan Digital',
  brand_name text not null default 'Konten Cuan Digital',
  product_name text not null default '7500+ Video Affiliate',
  timezone text not null default 'Asia/Jakarta',
  created_at timestamptz not null default now(),
  unique(owner_id)
);

create table if not exists public.ai_agents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  slug text not null,
  name text not null,
  role text not null,
  system_instructions text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(workspace_id, slug)
);

create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null,
  objective text,
  target_audience text,
  platform text[] not null default '{}',
  format text,
  content_pillar text,
  hook text,
  script text,
  caption text,
  hashtags text[] not null default '{}',
  cta text,
  status text not null default 'idea'
    check (status in ('idea','research','draft','production','review','approved','revision','scheduled','publishing','published','failed','archived')),
  approval_required boolean not null default true,
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  scheduled_at timestamptz,
  published_at timestamptz,
  created_by_agent uuid references public.ai_agents(id) on delete set null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.content_assets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  content_id uuid not null references public.content_items(id) on delete cascade,
  storage_path text not null,
  asset_type text not null check (asset_type in ('image','video','audio','document','thumbnail','other')),
  mime_type text,
  version integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.approval_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  content_id uuid not null references public.content_items(id) on delete cascade,
  actor_id uuid not null references auth.users(id),
  decision text not null check (decision in ('approved','revision','rejected')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.social_accounts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  platform text not null check (platform in ('instagram','tiktok')),
  account_label text,
  external_account_id text,
  connection_status text not null default 'disconnected',
  token_secret_ref text, -- referensi secret di backend; jangan simpan access token plaintext di tabel
  scopes text[] not null default '{}',
  connected_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.publish_jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  content_id uuid not null references public.content_items(id) on delete cascade,
  social_account_id uuid not null references public.social_accounts(id) on delete cascade,
  scheduled_at timestamptz not null,
  status text not null default 'queued'
    check (status in ('queued','processing','published','failed','cancelled')),
  external_post_id text,
  published_url text,
  error_message text,
  attempts integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.analytics_daily (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  content_id uuid not null references public.content_items(id) on delete cascade,
  platform text not null,
  metric_date date not null,
  impressions bigint not null default 0,
  reach bigint not null default 0,
  views bigint not null default 0,
  likes bigint not null default 0,
  comments bigint not null default 0,
  shares bigint not null default 0,
  saves bigint not null default 0,
  watch_time_seconds numeric,
  profile_visits bigint not null default 0,
  link_clicks bigint not null default 0,
  raw_metrics jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique(content_id, platform, metric_date)
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  source_platform text,
  contact_handle text,
  contact_name text,
  interest text,
  stage text not null default 'new' check (stage in ('new','contacted','qualified','converted','lost')),
  notes text,
  consent_to_contact boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  product_name text not null default '7500+ Video Affiliate',
  order_reference text,
  gross_amount numeric(14,2) not null default 0,
  fees numeric(14,2) not null default 0,
  other_costs numeric(14,2) not null default 0,
  status text not null default 'pending' check (status in ('pending','paid','refunded','cancelled')),
  sold_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.automation_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  workflow_name text not null,
  trigger_source text,
  status text not null default 'queued' check (status in ('queued','running','success','failed','cancelled')),
  input_summary jsonb not null default '{}',
  output_summary jsonb not null default '{}',
  error_message text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_content_workspace_status on public.content_items(workspace_id, status);
create index if not exists idx_content_schedule on public.content_items(workspace_id, scheduled_at);
create index if not exists idx_publish_due on public.publish_jobs(status, scheduled_at);
create index if not exists idx_analytics_content_date on public.analytics_daily(content_id, metric_date);
create index if not exists idx_leads_workspace_stage on public.leads(workspace_id, stage);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists trg_content_updated on public.content_items;
create trigger trg_content_updated before update on public.content_items
for each row execute function public.set_updated_at();

drop trigger if exists trg_publish_updated on public.publish_jobs;
create trigger trg_publish_updated before update on public.publish_jobs
for each row execute function public.set_updated_at();

-- Owner isolation: every row belongs to a workspace owned by auth.uid().
create or replace function public.owns_workspace(wid uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.workspaces w where w.id = wid and w.owner_id = auth.uid()); $$;

alter table public.workspaces enable row level security;
alter table public.ai_agents enable row level security;
alter table public.content_items enable row level security;
alter table public.content_assets enable row level security;
alter table public.approval_events enable row level security;
alter table public.social_accounts enable row level security;
alter table public.publish_jobs enable row level security;
alter table public.analytics_daily enable row level security;
alter table public.leads enable row level security;
alter table public.sales enable row level security;
alter table public.automation_runs enable row level security;

drop policy if exists "workspace owner access" on public.workspaces;
create policy "workspace owner access" on public.workspaces
for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Workspace-scoped policies for all operational tables.
do $$
declare t text;
begin
 foreach t in array array['ai_agents','content_items','content_assets','approval_events','social_accounts','publish_jobs','analytics_daily','leads','sales','automation_runs']
 loop
   execute format('drop policy if exists %I on public.%I', t || ' owner access', t);
   execute format('create policy %I on public.%I for all using (public.owns_workspace(workspace_id)) with check (public.owns_workspace(workspace_id))', t || ' owner access', t);
 end loop;
end $$;

-- IMPORTANT:
-- 1) Do not put Supabase service_role key or AI provider keys in browser code.
-- 2) Keep provider tokens in n8n credentials / Supabase Vault / Edge Function secrets.
-- 3) Publisher backend must verify content.status = 'approved' AND approved_at IS NOT NULL
--    before creating or executing a publish job.
-- 4) Use official Meta/TikTok APIs and comply with their app review, account eligibility,
--    publishing limits, music, and content policies.
