-- NEURALWIRE schema. Shared stories pool + per-user personal data.
-- All RLS policies: shared data readable by everyone; personal rows owner-only;
-- writes from the server use the service_role key (bypasses RLS by default).

-- ── profiles ────────────────────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  avatar_url text,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Auto-create a profile on signup.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username)
  values (new.id, split_part(coalesce(new.raw_user_meta_data->>'name', new.email), '@', 1))
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── sources (built-in wires) ───────────────────────────────────────────────
create table public.sources (
  id text primary key,
  name text not null,
  short text not null,
  color text,
  grad text,
  kind text not null,
  url text,
  enabled boolean not null default true,
  last_fetched_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.sources enable row level security;
create policy "sources_read" on public.sources for select using (true);

-- ── custom_wires (user-added feeds) ────────────────────────────────────────
create table public.custom_wires (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  url text not null,
  kind text not null default 'rss',
  status text not null default 'pending',
  last_fetched_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.custom_wires enable row level security;
create policy "custom_wires_read_own" on public.custom_wires for select using (auth.uid() = user_id);
create policy "custom_wires_insert_own" on public.custom_wires for insert with check (auth.uid() = user_id);
create policy "custom_wires_update_own" on public.custom_wires for update using (auth.uid() = user_id);
create policy "custom_wires_delete_own" on public.custom_wires for delete using (auth.uid() = user_id);

-- ── stories (global pool) ──────────────────────────────────────────────────
create table public.stories (
  id text primary key,
  source_id text not null references public.sources(id) on delete cascade,
  custom_wire_id uuid references public.custom_wires(id) on delete set null,
  title text not null,
  link text not null,
  description text,
  thumbnail text,
  points integer,
  comments integer,
  discussion text,
  models text[] not null default '{}',
  topics text[] not null default '{}',
  entities text[] not null default '{}',
  is_model boolean not null default false,
  published_at timestamptz not null,
  fetched_at timestamptz not null default now()
);
alter table public.stories enable row level security;
create policy "stories_read" on public.stories for select using (true);
create index stories_published_at_idx on public.stories (published_at desc);
create index stories_source_idx on public.stories (source_id);
create index stories_models_idx on public.stories using gin (models);
create index stories_topics_idx on public.stories using gin (topics);

-- ── entities (canonical watchlist identity) ────────────────────────────────
create table public.entities (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  kind text not null,
  aliases text[] not null default '{}',
  created_at timestamptz not null default now()
);
alter table public.entities enable row level security;
create policy "entities_read" on public.entities for select using (true);

create table public.story_entities (
  story_id text not null references public.stories(id) on delete cascade,
  entity_id uuid not null references public.entities(id) on delete cascade,
  primary key (story_id, entity_id)
);
alter table public.story_entities enable row level security;
create policy "story_entities_read" on public.story_entities for select using (true);
create index story_entities_entity_idx on public.story_entities (entity_id);

-- ── benchmarks (leaderboard) ───────────────────────────────────────────────
create table public.benchmarks (
  id text primary key,
  name text not null unique,
  unit text not null default '%',
  higher_is_better boolean not null default true
);
alter table public.benchmarks enable row level security;
create policy "benchmarks_read" on public.benchmarks for select using (true);

create table public.benchmark_scores (
  id uuid primary key default gen_random_uuid(),
  model_entity_id uuid not null references public.entities(id) on delete cascade,
  benchmark_id text not null references public.benchmarks(id) on delete cascade,
  score numeric not null,
  unit text not null default '%',
  source_story_id text references public.stories(id) on delete set null,
  reported_at timestamptz not null,
  unique (model_entity_id, benchmark_id, source_story_id)
);
alter table public.benchmark_scores enable row level security;
create policy "benchmark_scores_read" on public.benchmark_scores for select using (true);
create index benchmark_scores_bench_idx on public.benchmark_scores (benchmark_id, reported_at desc);

-- ── watchlist (entity follows) ─────────────────────────────────────────────
create table public.watchlist (
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_id uuid not null references public.entities(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, entity_id)
);
alter table public.watchlist enable row level security;
create policy "watchlist_select_own" on public.watchlist for select using (auth.uid() = user_id);
create policy "watchlist_insert_own" on public.watchlist for insert with check (auth.uid() = user_id);
create policy "watchlist_delete_own" on public.watchlist for delete using (auth.uid() = user_id);

-- ── collections (bookmark folders) ─────────────────────────────────────────
create table public.collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.collections enable row level security;
create policy "collections_select_own" on public.collections for select using (auth.uid() = user_id or is_public);
create policy "collections_insert_own" on public.collections for insert with check (auth.uid() = user_id);
create policy "collections_update_own" on public.collections for update using (auth.uid() = user_id);
create policy "collections_delete_own" on public.collections for delete using (auth.uid() = user_id);

create table public.collection_items (
  collection_id uuid not null references public.collections(id) on delete cascade,
  story_id text not null references public.stories(id) on delete cascade,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (collection_id, story_id)
);
alter table public.collection_items enable row level security;
create policy "collection_items_select" on public.collection_items for select using (
  exists (select 1 from public.collections c where c.id = collection_id and (c.user_id = auth.uid() or c.is_public))
);
create policy "collection_items_insert" on public.collection_items for insert with check (
  exists (select 1 from public.collections c where c.id = collection_id and c.user_id = auth.uid())
);
create policy "collection_items_delete" on public.collection_items for delete using (
  exists (select 1 from public.collections c where c.id = collection_id and c.user_id = auth.uid())
);

-- ── notes & tags ───────────────────────────────────────────────────────────
create table public.story_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  story_id text not null references public.stories(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.story_notes enable row level security;
create policy "story_notes_select_own" on public.story_notes for select using (auth.uid() = user_id);
create policy "story_notes_insert_own" on public.story_notes for insert with check (auth.uid() = user_id);
create policy "story_notes_update_own" on public.story_notes for update using (auth.uid() = user_id);
create policy "story_notes_delete_own" on public.story_notes for delete using (auth.uid() = user_id);

create table public.story_tags (
  user_id uuid not null references auth.users(id) on delete cascade,
  story_id text not null references public.stories(id) on delete cascade,
  tag text not null,
  primary key (user_id, story_id, tag)
);
alter table public.story_tags enable row level security;
create policy "story_tags_select_own" on public.story_tags for select using (auth.uid() = user_id);
create policy "story_tags_insert_own" on public.story_tags for insert with check (auth.uid() = user_id);
create policy "story_tags_delete_own" on public.story_tags for delete using (auth.uid() = user_id);

-- ── read state & prefs ─────────────────────────────────────────────────────
create table public.read_state (
  user_id uuid not null references auth.users(id) on delete cascade,
  story_id text not null references public.stories(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (user_id, story_id)
);
alter table public.read_state enable row level security;
create policy "read_state_select_own" on public.read_state for select using (auth.uid() = user_id);
create policy "read_state_insert_own" on public.read_state for insert with check (auth.uid() = user_id);
create policy "read_state_delete_own" on public.read_state for delete using (auth.uid() = user_id);

create table public.user_prefs (
  user_id uuid primary key references auth.users(id) on delete cascade,
  prefs jsonb not null default '{}',
  updated_at timestamptz not null default now()
);
alter table public.user_prefs enable row level security;
create policy "user_prefs_select_own" on public.user_prefs for select using (auth.uid() = user_id);
-- Postgres has no FOR UPSERT policy clause; FOR ALL covers insert/update for the owner.
create policy "user_prefs_upsert_own" on public.user_prefs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
