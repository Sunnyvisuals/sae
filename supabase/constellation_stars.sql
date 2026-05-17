-- Constellation collective (Acte III) — exécuter dans Supabase SQL Editor
create table if not exists public.constellation (
  id uuid primary key default gen_random_uuid(),
  mot text not null check (char_length(mot) between 2 and 32),
  prenom_ville text check (prenom_ville is null or char_length(prenom_ville) <= 80),
  created_at timestamptz not null default now()
);

create index if not exists constellation_mot_idx on public.constellation (mot);
create index if not exists constellation_created_at_idx on public.constellation (created_at);

alter table public.constellation enable row level security;

create policy "constellation_select_public"
  on public.constellation for select
  to anon, authenticated
  using (true);

create policy "constellation_insert_anon"
  on public.constellation for insert
  to anon, authenticated
  with check (true);

-- Ancienne table (optionnel) — peut coexister le temps de la migration
-- create table if not exists public.constellation_stars (...);
