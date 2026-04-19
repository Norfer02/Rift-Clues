alter table public.players
add column if not exists slot_index integer;

update public.players
set slot_index = 0
where slot_index is null
  and role = 'summoner';

update public.players
set slot_index = 0
where slot_index is null
  and role = 'champion';
