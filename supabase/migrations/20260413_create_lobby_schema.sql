create extension if not exists pgcrypto;

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  status text not null default 'lobby',
  host_id text,
  game_state jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rooms_code_unique unique (code),
  constraint rooms_code_format check (code ~ '^[A-Z0-9]{6}$'),
  constraint rooms_status_check check (status in ('lobby', 'playing', 'finished'))
);

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  player_id text not null,
  display_name text not null,
  avatar text,
  player_status text not null default 'active',
  side text,
  role text,
  slot_index integer,
  is_host boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint players_player_status_check check (player_status in ('active', 'spectator')),
  constraint players_side_check check (side is null or side in ('blue', 'red')),
  constraint players_role_check check (role is null or role in ('summoner', 'champion')),
  constraint players_slot_index_check check (
    slot_index is null
    or (
      role = 'summoner'
      and slot_index = 0
    )
    or (
      role = 'champion'
      and slot_index between 0 and 2
    )
  )
);

create unique index if not exists players_room_player_unique
  on public.players(room_id, player_id);

create unique index if not exists players_room_slot_unique
  on public.players(room_id, side, role, slot_index)
  where side is not null
    and role is not null
    and slot_index is not null
    and player_status = 'active';

create index if not exists rooms_code_idx on public.rooms(code);
create index if not exists players_room_id_idx on public.players(room_id);
create index if not exists players_room_created_at_idx on public.players(room_id, created_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_rooms_updated_at on public.rooms;
create trigger set_rooms_updated_at
before update on public.rooms
for each row execute function public.set_updated_at();

drop trigger if exists set_players_updated_at on public.players;
create trigger set_players_updated_at
before update on public.players
for each row execute function public.set_updated_at();

alter table public.rooms enable row level security;
alter table public.players enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'rooms'
      and policyname = 'rooms are readable by clients'
  ) then
    create policy "rooms are readable by clients"
      on public.rooms
      for select
      to anon, authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'players'
      and policyname = 'players are readable by clients'
  ) then
    create policy "players are readable by clients"
      on public.players
      for select
      to anon, authenticated
      using (true);
  end if;
end;
$$;

do $$
begin
  alter publication supabase_realtime add table public.rooms;
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  alter publication supabase_realtime add table public.players;
exception
  when duplicate_object then null;
end;
$$;

alter table public.rooms replica identity full;
alter table public.players replica identity full;
