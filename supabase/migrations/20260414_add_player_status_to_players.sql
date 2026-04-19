alter table public.players
add column if not exists player_status text not null default 'active';

update public.players
set player_status = 'active'
where player_status is null;
