-- DeckSmith AI — initial schema (Supabase)
-- Users are managed by Supabase Auth; we extend with profiles and app tables.

-- Profiles (optional; link to auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Credits: 1 credit = 1 slide; free tier = first 10 slides
create table if not exists public.credits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  balance int not null default 0 check (balance >= 0),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id)
);

-- Decks
create table if not exists public.decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text,
  source_type text not null check (source_type in ('prompt', 'url')),
  source_description text,
  source_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Slides (JSONB for flexible slide data)
create table if not exists public.slides (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references public.decks (id) on delete cascade,
  position int not null,
  data jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS
alter table public.profiles enable row level security;
alter table public.credits enable row level security;
alter table public.decks enable row level security;
alter table public.slides enable row level security;

create policy "Users can read own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

create policy "Users can read own credits" on public.credits for select using (auth.uid() = user_id);
create policy "Service role can manage credits" on public.credits for all using (auth.jwt() ->> 'role' = 'service_role');

create policy "Users can CRUD own decks" on public.decks for all using (auth.uid() = user_id);
create policy "Users can CRUD own slides" on public.slides for all using (
  exists (select 1 from public.decks where decks.id = slides.deck_id and decks.user_id = auth.uid())
);

-- Indexes
create index decks_user_id on public.decks (user_id);
create index slides_deck_id on public.slides (deck_id);
create index credits_user_id on public.credits (user_id);

-- Trigger: create credits row for new user (run via Edge Function or on first login)
-- For MVP you can insert credits manually or via API when user signs up.
