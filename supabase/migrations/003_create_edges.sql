create table if not exists edges (
  id        uuid primary key default gen_random_uuid(),
  source_id uuid references nodes(id) on delete cascade,
  target_id uuid references nodes(id) on delete cascade,
  strength  float default 0.5,
  label     text,
  created_at timestamptz default now()
);

alter table edges enable row level security;

create policy "anon select edges"
  on edges for select
  to anon
  using (true);
