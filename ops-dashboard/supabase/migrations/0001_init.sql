-- ops-dashboard: initial schema, mirrors the task/spend shapes from
-- src/store.js (see newTask/normalizeTask, newSpend/normalizeSpend).
--
-- Run this once in the Supabase Dashboard -> SQL Editor for this project
-- (https://yhlpgildpyzdmdefrzqj.supabase.co). The anon/publishable key
-- used by the app can only do table CRUD via PostgREST, not DDL, so this
-- file has to be applied manually rather than by the app itself.
--
-- Single-user app, no Supabase Auth: RLS is enabled (keeps Supabase's own
-- linter/advisors quiet) but every policy is "true" for the anon role, so
-- it behaves exactly like RLS-disabled — anyone with the anon key (i.e.
-- anyone who loads the deployed site) has full read/write. That's the
-- explicit tradeoff of a single-user app with no login.

create table if not exists tasks (
  id                text primary key,
  title             text not null,
  category          text not null check (category in ('maintenance', 'housekeeping', 'ops', 'personal')),
  property          text check (property in ('MRP', 'LB', 'Kove')),
  priority          text not null default 'med' check (priority in ('high', 'med', 'low')),
  due_date          date,
  assignee          text,
  cost              numeric,
  notes             text,
  recurrence        jsonb,          -- { unit: 'day'|'week'|'month', interval: n } or null
  original_due_date date,           -- set by rollover so overdue tasks stay flagged
  inbox             boolean not null default false,
  done              boolean not null default false,
  created_at        date not null default current_date,
  completed_at      date,
  updated_at        timestamptz not null default now()
);

create table if not exists personal_spend (
  id          text primary key,
  amount      numeric not null,
  description text not null,
  category    text,
  date        date not null,
  created_at  date not null default current_date,
  updated_at  timestamptz not null default now()
);

create index if not exists tasks_due_date_idx on tasks (due_date);
create index if not exists tasks_done_idx on tasks (done);
create index if not exists personal_spend_date_idx on personal_spend (date);

-- Keep updated_at current on every row edit (used only as a light sanity
-- signal in the client, not for conflict resolution).
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists tasks_set_updated_at on tasks;
create trigger tasks_set_updated_at
  before update on tasks
  for each row execute function set_updated_at();

drop trigger if exists personal_spend_set_updated_at on personal_spend;
create trigger personal_spend_set_updated_at
  before update on personal_spend
  for each row execute function set_updated_at();

alter table tasks enable row level security;
alter table personal_spend enable row level security;

drop policy if exists "anon full access" on tasks;
create policy "anon full access" on tasks
  for all
  to anon
  using (true)
  with check (true);

drop policy if exists "anon full access" on personal_spend;
create policy "anon full access" on personal_spend
  for all
  to anon
  using (true)
  with check (true);
