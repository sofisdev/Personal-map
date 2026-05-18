create table if not exists nodes (
  id          uuid primary key default gen_random_uuid(),
  label       text not null,
  type        text,
  description text,
  url         text,
  color       text,
  size        float default 1.0,
  position_x  float,
  position_y  float,
  position_z  float,
  created_at  timestamptz default now()
);

alter table nodes enable row level security;

create policy "anon select nodes"
  on nodes for select
  to anon
  using (true);
