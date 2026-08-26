-- Custom alerts table for NEURALWIRE
create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  keywords text[] not null default '{}',
  entities text[] not null default '{}',
  topics text[] not null default '{}',
  active boolean not null default true,
  last_triggered_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.alerts enable row level security;
create policy "alerts_select_own" on public.alerts for select using (auth.uid() = user_id);
create policy "alerts_insert_own" on public.alerts for insert with check (auth.uid() = user_id);
create policy "alerts_update_own" on public.alerts for update using (auth.uid() = user_id);
create policy "alerts_delete_own" on public.alerts for delete using (auth.uid() = user_id);

create index alerts_user_idx on public.alerts (user_id, created_at desc);
