-- ops-dashboard: lock tasks/personal_spend down to the single
-- authenticated user, replacing the wide-open anon policies from
-- 0001_init.sql.
--
-- IMPORTANT — run this AFTER creating your account in the Supabase
-- Dashboard (Authentication -> Users -> Add user). Check "Auto Confirm
-- User" when creating it, otherwise sign-in will fail with "Email not
-- confirmed" until you click the confirmation email.
--
-- This migration finds your user id via `select id from auth.users
-- limit 1` — safe because this is a single-user app, so there is
-- exactly one row in auth.users once your account exists. If you run
-- this BEFORE creating the account, the backfill has nothing to assign
-- and the final NOT NULL step will fail — just create the account and
-- re-run.

alter table tasks add column if not exists user_id uuid references auth.users(id) default auth.uid();
alter table personal_spend add column if not exists user_id uuid references auth.users(id) default auth.uid();

update tasks set user_id = (select id from auth.users limit 1) where user_id is null;
update personal_spend set user_id = (select id from auth.users limit 1) where user_id is null;

alter table tasks alter column user_id set not null;
alter table personal_spend alter column user_id set not null;

create index if not exists tasks_user_id_idx on tasks (user_id);
create index if not exists personal_spend_user_id_idx on personal_spend (user_id);

drop policy if exists "anon full access" on tasks;
drop policy if exists "anon full access" on personal_spend;

create policy "user can access own tasks" on tasks
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "user can access own personal_spend" on personal_spend
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
