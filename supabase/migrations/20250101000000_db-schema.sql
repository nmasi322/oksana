-- Flow Builder schema
-- Run against your Supabase project (SQL editor or `supabase db push`).

create extension if not exists "pgcrypto";

create table if not exists organizations (
	id uuid primary key default gen_random_uuid(),
	name text not null,
	created_at timestamptz not null default now()
);

create table if not exists flows (
	id uuid primary key default gen_random_uuid(),
	org_id uuid not null references organizations (id) on delete cascade,
	name text not null default 'Untitled flow',
	kind text not null check (kind in ('workflow', 'chatflow')),
	status text not null default 'draft' check (status in ('draft', 'published')),
	nodes jsonb not null default '[]'::jsonb,
	edges jsonb not null default '[]'::jsonb,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create index if not exists flows_org_id_idx on flows (org_id);

-- Per-organization guardrail limits, keyed by node type. Only action and
-- human_handoff nodes render a Guardrails section in the inspector, but the
-- table isn't restricted to those types in case that changes later.
create table if not exists guardrail_limits (
	id uuid primary key default gen_random_uuid(),
	org_id uuid not null references organizations (id) on delete cascade,
	node_type text not null,
	requires_approval_default boolean not null default false,
	max_spending_limit text,
	allowed_override_roles text[] not null default '{}',
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	unique (org_id, node_type)
);

-- Stub test runs. The real execution engine is out of scope for this phase;
-- rows here just simulate a run's lifecycle so the Test Run modal has
-- something real to poll.
create table if not exists test_runs (
	id uuid primary key default gen_random_uuid(),
	flow_id uuid not null references flows (id) on delete cascade,
	node_id text not null,
	status text not null default 'queued' check (status in ('queued', 'running', 'succeeded', 'failed')),
	output jsonb,
	error text,
	created_at timestamptz not null default now(),
	completed_at timestamptz
);

create index if not exists test_runs_flow_id_idx on test_runs (flow_id);

create or replace function set_updated_at()
returns trigger as $$
begin
	new.updated_at = now();
	return new;
end;
$$ language plpgsql;

drop trigger if exists flows_set_updated_at on flows;
create trigger flows_set_updated_at
	before update on flows
	for each row execute function set_updated_at();

drop trigger if exists guardrail_limits_set_updated_at on guardrail_limits;
create trigger guardrail_limits_set_updated_at
	before update on guardrail_limits
	for each row execute function set_updated_at();

-- Seed a default org + sensible guardrail defaults so a fresh project has
-- something to point the app at. Replace org id usage in the app once real
-- auth/org selection exists.
insert into organizations (id, name)
values ('00000000-0000-0000-0000-000000000001', 'Default organization')
on conflict (id) do nothing;

insert into guardrail_limits (org_id, node_type, requires_approval_default, max_spending_limit, allowed_override_roles)
values
	('00000000-0000-0000-0000-000000000001', 'action', false, null, '{}'),
	('00000000-0000-0000-0000-000000000001', 'human_handoff', false, null, '{}')
on conflict (org_id, node_type) do nothing;
