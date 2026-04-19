alter table public.players
add column if not exists avatar text;

update public.players
set avatar = '/champion/Ahri.png'
where avatar is null;
