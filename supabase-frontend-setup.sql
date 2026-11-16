-- Persist the brand slogan in the owner workspace.
alter table public.workspaces
  add column if not exists slogan text not null default 'Mulai Kecil, Bangun Peluang Digital';

-- AI Office frontend setup: run after supabase-schema.sql
-- Grants for signed-in owner. RLS policies remain the row-level security boundary.
revoke all on table public.workspaces, public.ai_agents, public.content_items,
  public.content_assets, public.approval_events, public.social_accounts,
  public.publish_jobs, public.analytics_daily, public.leads, public.sales,
  public.automation_runs from anon;

grant select, insert, update, delete on table public.workspaces, public.ai_agents,
  public.content_items, public.content_assets, public.approval_events,
  public.social_accounts, public.publish_jobs, public.analytics_daily,
  public.leads, public.sales, public.automation_runs to authenticated;

-- Enable Realtime for content_items, if it is not already in the publication.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'content_items'
  ) then
    alter publication supabase_realtime add table public.content_items;
  end if;
end $$;
