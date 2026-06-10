-- Run this in your Supabase SQL editor (supabase.com → your project → SQL Editor)

create table recipes (
  id bigint generated always as identity primary key,
  name text not null,
  description text,
  created_at timestamptz default now()
);

create table ingredients (
  id bigint generated always as identity primary key,
  recipe_id bigint references recipes(id) on delete cascade not null,
  name text not null,
  quantity numeric not null,
  unit text not null,
  position int default 0
);

-- Enable Row Level Security (allow all for now — lock down after adding auth)
alter table recipes enable row level security;
alter table ingredients enable row level security;

create policy "Allow all on recipes" on recipes for all using (true) with check (true);
create policy "Allow all on ingredients" on ingredients for all using (true) with check (true);
