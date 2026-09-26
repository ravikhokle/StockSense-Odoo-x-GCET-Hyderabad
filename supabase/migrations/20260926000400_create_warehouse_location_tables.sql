create table public.warehouses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_code text not null,
  address text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index warehouses_short_code_lower_idx on public.warehouses (lower(short_code));
create index warehouses_name_idx on public.warehouses (name);

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  warehouse_id uuid not null references public.warehouses(id) on delete cascade,
  name text not null,
  short_code text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (warehouse_id, short_code)
);

create index locations_warehouse_id_idx on public.locations (warehouse_id);
create index locations_name_idx on public.locations (name);

alter table public.stock_levels add column location_id uuid references public.locations(id) on delete set null;
create index stock_levels_location_id_idx on public.stock_levels (location_id);

alter table public.warehouses enable row level security;
alter table public.locations enable row level security;

create policy "Authenticated users can view warehouses"
  on public.warehouses for select to authenticated using (true);
create policy "Authenticated users can create warehouses"
  on public.warehouses for insert to authenticated with check (true);
create policy "Authenticated users can update warehouses"
  on public.warehouses for update to authenticated using (true) with check (true);

create policy "Authenticated users can view locations"
  on public.locations for select to authenticated using (true);
create policy "Authenticated users can create locations"
  on public.locations for insert to authenticated with check (true);
create policy "Authenticated users can update locations"
  on public.locations for update to authenticated using (true) with check (true);

create or replace function public.set_network_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create trigger warehouses_set_updated_at before update on public.warehouses
for each row execute procedure public.set_network_updated_at();

create trigger locations_set_updated_at before update on public.locations
for each row execute procedure public.set_network_updated_at();
