create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index categories_name_lower_idx on public.categories (lower(name));

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sku text not null,
  category_id uuid references public.categories(id) on delete set null,
  unit text not null,
  reorder_level numeric(14, 3) not null default 0 check (reorder_level >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index products_sku_lower_idx on public.products (lower(sku));
create index products_category_id_idx on public.products (category_id);
create index products_name_idx on public.products (name);

create table public.stock_levels (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  location_name text not null default 'Default location',
  quantity numeric(14, 3) not null default 0 check (quantity >= 0),
  reserved_quantity numeric(14, 3) not null default 0 check (reserved_quantity >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (product_id, location_name)
);

create index stock_levels_product_id_idx on public.stock_levels (product_id);
create index stock_levels_location_name_idx on public.stock_levels (location_name);

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.stock_levels enable row level security;

create policy "Authenticated users can view categories"
  on public.categories for select to authenticated using (true);
create policy "Authenticated users can create categories"
  on public.categories for insert to authenticated with check (true);

create policy "Authenticated users can view products"
  on public.products for select to authenticated using (true);
create policy "Authenticated users can create products"
  on public.products for insert to authenticated with check (true);
create policy "Authenticated users can update products"
  on public.products for update to authenticated using (true) with check (true);

create policy "Authenticated users can view stock levels"
  on public.stock_levels for select to authenticated using (true);
create policy "Authenticated users can create stock levels"
  on public.stock_levels for insert to authenticated with check (true);

create or replace function public.set_product_updated_at()
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

create trigger products_set_updated_at
  before update on public.products
  for each row execute procedure public.set_product_updated_at();

create trigger stock_levels_set_updated_at
  before update on public.stock_levels
  for each row execute procedure public.set_product_updated_at();
