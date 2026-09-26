create sequence public.delivery_reference_seq;

create table public.deliveries (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  delivery_address text not null,
  responsible text not null,
  operation_type text not null,
  source_location_id uuid not null references public.locations(id) on delete restrict,
  schedule_date date not null,
  status text not null default 'draft' check (status in ('draft', 'waiting', 'ready', 'done', 'cancelled')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index deliveries_status_idx on public.deliveries (status);
create index deliveries_schedule_date_idx on public.deliveries (schedule_date);
create index deliveries_source_location_id_idx on public.deliveries (source_location_id);

create table public.delivery_items (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid not null references public.deliveries(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity numeric(14, 3) not null check (quantity > 0),
  created_at timestamptz not null default timezone('utc', now()),
  unique (delivery_id, product_id)
);

create index delivery_items_delivery_id_idx on public.delivery_items (delivery_id);
create index delivery_items_product_id_idx on public.delivery_items (product_id);

alter table public.stock_movements alter column receipt_id drop not null;
alter table public.stock_movements add column delivery_id uuid references public.deliveries(id) on delete restrict;
alter table public.stock_movements drop constraint if exists stock_movements_movement_type_check;
alter table public.stock_movements add constraint stock_movements_movement_type_check check (movement_type in ('receipt', 'delivery'));
alter table public.stock_movements add constraint stock_movements_source_check check ((receipt_id is not null) <> (delivery_id is not null));
create index stock_movements_delivery_id_idx on public.stock_movements (delivery_id);

create or replace function public.set_delivery_reference()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.reference is null or new.reference = '' then
    new.reference = 'WH/OUT/' || lpad(nextval('public.delivery_reference_seq')::text, 4, '0');
  end if;
  return new;
end;
$$;

create trigger deliveries_set_reference before insert on public.deliveries
for each row execute procedure public.set_delivery_reference();

create or replace function public.set_delivery_updated_at()
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

create trigger deliveries_set_updated_at before update on public.deliveries
for each row execute procedure public.set_delivery_updated_at();

alter table public.deliveries enable row level security;
alter table public.delivery_items enable row level security;

create policy "Authenticated users can view deliveries"
  on public.deliveries for select to authenticated using (true);
create policy "Authenticated users can create deliveries"
  on public.deliveries for insert to authenticated with check (true);
create policy "Authenticated users can update deliveries"
  on public.deliveries for update to authenticated using (true) with check (true);

create policy "Authenticated users can view delivery items"
  on public.delivery_items for select to authenticated using (true);
create policy "Authenticated users can create delivery items"
  on public.delivery_items for insert to authenticated with check (true);

create or replace function public.complete_delivery(p_delivery_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  delivery_row public.deliveries%rowtype;
  item_row record;
  location_row public.locations%rowtype;
  stock_row public.stock_levels%rowtype;
  available_quantity numeric;
  product_name text;
begin
  select * into delivery_row from public.deliveries where id = p_delivery_id for update;
  if not found then raise exception 'Delivery not found'; end if;
  if delivery_row.status = 'done' then raise exception 'Delivery is already done'; end if;
  if delivery_row.status = 'cancelled' then raise exception 'Cancelled deliveries cannot be validated'; end if;
  if delivery_row.status <> 'ready' then raise exception 'Delivery must be Ready before validation'; end if;

  select * into location_row from public.locations where id = delivery_row.source_location_id;
  if not found then raise exception 'Source location not found'; end if;

  for item_row in select product_id, quantity from public.delivery_items where delivery_id = p_delivery_id loop
    select * into stock_row from public.stock_levels
      where product_id = item_row.product_id and location_id = location_row.id
      for update;
    select name into product_name from public.products where id = item_row.product_id;
    available_quantity := coalesce(stock_row.quantity - stock_row.reserved_quantity, 0);
    if stock_row.id is null or available_quantity < item_row.quantity then
      raise exception 'Insufficient stock for %. Available: %, requested: %', product_name, available_quantity, item_row.quantity;
    end if;

    update public.stock_levels
      set quantity = quantity - item_row.quantity, updated_at = timezone('utc', now())
      where id = stock_row.id;

    insert into public.stock_movements (delivery_id, product_id, location_id, quantity, movement_type)
    values (p_delivery_id, item_row.product_id, location_row.id, item_row.quantity, 'delivery');
  end loop;

  update public.deliveries set status = 'done', updated_at = timezone('utc', now()) where id = p_delivery_id;
end;
$$;

grant execute on function public.complete_delivery(uuid) to authenticated;
