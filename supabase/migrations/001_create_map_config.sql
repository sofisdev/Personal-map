create table if not exists map_config (
  id          uuid primary key default gen_random_uuid(),
  title       text,
  subtitle    text,
  theme       jsonb,
  physics     jsonb,
  updated_at  timestamptz default now()
);

alter table map_config enable row level security;

create policy "anon select map_config"
  on map_config for select
  to anon
  using (true);
