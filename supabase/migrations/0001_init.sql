create extension if not exists pgcrypto;

create type project_type as enum ('client_work', 'internal_tool', 'personal', 'learning', 'maintenance');
create type project_status as enum ('planning', 'active', 'paused', 'blocked', 'completed', 'archived');
create type work_status as enum ('todo', 'in_progress', 'done', 'blocked');
create type activity_type as enum ('dev_work', 'bugfix', 'webinar', 'training', 'meeting', 'research', 'support_ticket', 'pause', 'resume', 'note');

create table projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  type project_type not null default 'personal',
  tags text[] not null default '{}',
  priority smallint not null default 3 check (priority between 1 and 5),
  status project_status not null default 'planning',
  start_date date,
  target_date date,
  color text not null default '#4DE8FF',
  repo_link text,
  doc_link text,
  progress_override smallint check (progress_override between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table epics (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  description text,
  status work_status not null default 'todo',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  epic_id uuid references epics(id) on delete set null,
  title text not null,
  status work_status not null default 'todo',
  priority smallint check (priority between 1 and 5),
  due_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table activities (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  type activity_type not null,
  title text not null,
  notes text,
  is_public boolean not null default true,
  duration_minutes int check (duration_minutes is null or duration_minutes >= 0),
  skill_tags text[] not null default '{}',
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table pause_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  paused_at timestamptz not null default now(),
  reason text not null check (length(trim(reason)) > 0),
  resume_trigger text,
  expected_resume_date date,
  resumed_at timestamptz,
  resume_note text
);

create table share_links (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  token text not null unique default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  label text not null,
  scope_all boolean not null default true,
  expires_at timestamptz,
  revoked boolean not null default false,
  created_at timestamptz not null default now()
);

create table share_link_projects (
  share_link_id uuid not null references share_links(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  primary key (share_link_id, project_id)
);

create table suggestion_cache (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  generated_at timestamptz not null default now(),
  payload jsonb not null,
  expires_at timestamptz not null
);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger projects_set_updated_at
before update on projects
for each row execute function set_updated_at();

alter table projects enable row level security;
alter table epics enable row level security;
alter table tasks enable row level security;
alter table activities enable row level security;
alter table pause_events enable row level security;
alter table share_links enable row level security;
alter table share_link_projects enable row level security;
alter table suggestion_cache enable row level security;

create policy "owner_full_access_projects" on projects for all
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "owner_full_access_epics" on epics for all
  using (exists (select 1 from projects p where p.id = epics.project_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from projects p where p.id = epics.project_id and p.owner_id = auth.uid()));

create policy "owner_full_access_tasks" on tasks for all
  using (exists (select 1 from projects p where p.id = tasks.project_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from projects p where p.id = tasks.project_id and p.owner_id = auth.uid()));

create policy "owner_full_access_activities" on activities for all
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "owner_full_access_pause_events" on pause_events for all
  using (exists (select 1 from projects p where p.id = pause_events.project_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from projects p where p.id = pause_events.project_id and p.owner_id = auth.uid()));

create policy "owner_full_access_share_links" on share_links for all
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "owner_full_access_share_link_projects" on share_link_projects for all
  using (
    exists (
      select 1 from share_links sl
      where sl.id = share_link_projects.share_link_id and sl.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from share_links sl
      where sl.id = share_link_projects.share_link_id and sl.owner_id = auth.uid()
    )
  );

create policy "owner_full_access_suggestion_cache" on suggestion_cache for all
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create index idx_projects_owner_status on projects(owner_id, status);
create index idx_activities_owner_occurred on activities(owner_id, occurred_at desc);
create index idx_activities_project on activities(project_id);
create index idx_pause_events_project_open on pause_events(project_id) where resumed_at is null;
create index idx_share_links_token on share_links(token);
create index idx_suggestion_cache_owner on suggestion_cache(owner_id);

create or replace function get_shared_dashboard(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  link_row share_links%rowtype;
  payload jsonb;
begin
  select *
  into link_row
  from share_links
  where token = p_token
    and revoked = false
    and (expires_at is null or expires_at > now());

  if not found then
    return jsonb_build_object('error', 'invalid_or_expired_link');
  end if;

  with visible_projects as (
    select p.*
    from projects p
    where p.owner_id = link_row.owner_id
      and p.status <> 'archived'
      and (
        link_row.scope_all
        or exists (
          select 1 from share_link_projects slp
          where slp.share_link_id = link_row.id and slp.project_id = p.id
        )
      )
  ),
  public_activities as (
    select a.*
    from activities a
    where a.owner_id = link_row.owner_id
      and a.is_public = true
      and (
        a.project_id is null
        or exists (select 1 from visible_projects vp where vp.id = a.project_id)
      )
  )
  select jsonb_build_object(
    'share', jsonb_build_object('label', link_row.label),
    'projects', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', vp.id,
        'name', vp.name,
        'description', vp.description,
        'type', vp.type,
        'tags', vp.tags,
        'priority', vp.priority,
        'status', vp.status,
        'target_date', vp.target_date,
        'color', vp.color,
        'progress_override', vp.progress_override,
        'updated_at', vp.updated_at
      ) order by vp.updated_at desc)
      from visible_projects vp
    ), '[]'::jsonb),
    'activities', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', pa.id,
        'project_id', pa.project_id,
        'type', pa.type,
        'title', pa.title,
        'duration_minutes', pa.duration_minutes,
        'occurred_at', pa.occurred_at
      ) order by pa.occurred_at desc)
      from public_activities pa
    ), '[]'::jsonb)
  )
  into payload;

  return payload;
end;
$$;

revoke all on function get_shared_dashboard(text) from public;
grant execute on function get_shared_dashboard(text) to anon;
