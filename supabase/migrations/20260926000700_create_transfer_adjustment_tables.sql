create sequence public.transfer_reference_seq;

create table public.transfers (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  source_location_id uuid not null references public.locations(id) on delete restrict,
  destination_location_id uuid not null references public.locations(id) on delete restrict,
  responsible text not null,
  schedule_date date not null,
  status text not null default 'draft' check (status in ('draft', 'ready', 'done', 'cancelled')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (source_location_id <> destination_location_id)
);

create table public.transfer_items (
  id uuid primary key default gen_random_uuid(),
  transfer_id uuid not null references public.transfers(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity numeric(14, 3) not null check (quantity > 0),
  created_at timestamptz not null default timezone('utc', now()),
  unique (transfer_id, product_id)
);

create table public.adjustments (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.locations(id) on delete restrict,
  reason text not null,
  status text not null default 'draft' check (status in ('draft', 'validated', 'cancelled')),
  validated_by uuid references auth.users(id) on delete set null,
  validated_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.adjustment_items (
  id uuid primary key default gen_random_uuid(),
  adjustment_id uuid not null references public.adjustments(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  current_quantity numeric(14, 3) not null check (current_quantity >= 0),
  counted_quantity numeric(14, 3) not null check (counted_quantity >= 0),
  difference numeric(14, 3) generated always as (counted_quantity - current_quantity) stored,
  created_at timestamptz not null default timezone('utc', now()),
  unique (adjustment_id, product_id)
);

alter table public.stock_movements alter column receipt_id drop not null;
alter table public.stock_movements add column if not exists transfer_id uuid references public.transfers(id) on delete restrict;
alter table public.stock_movements add column if not exists adjustment_id uuid references public.adjustments(id) on delete restrict;
alter table public.stock_movements add column if not exists from_location_id uuid references public.locations(id) on delete restrict;
alter table public.stock_movements add column if not exists to_location_id uuid references public.locations(id) on delete restrict;
alter table public.stock_movements drop constraint if exists stock_movements_movement_type_check;
alter table public.stock_movements drop constraint if exists stock_movements_source_check;
alter table public.stock_movements drop constraint if exists stock_movements_quantity_check;
alter table public.stock_movements add constraint stock_movements_movement_type_check check (movement_type in ('receipt', 'delivery', 'transfer', 'adjustment'));
alter table public.stock_movements add constraint stock_movements_source_check check ((case when receipt_id is not null then 1 else 0 end) + (case when delivery_id is not null then 1 else 0 end) + (case when transfer_id is not null then 1 else 0 end) + (case when adjustment_id is not null then 1 else 0 end) = 1);
alter table public.stock_movements add constraint stock_movements_quantity_check check (quantity <> 0);

create index transfers_status_idx on public.transfers (status);
create index transfers_schedule_date_idx on public.transfers (schedule_date);
create index transfer_items_transfer_id_idx on public.transfer_items (transfer_id);
create index adjustment_items_adjustment_id_idx on public.adjustment_items (adjustment_id);
create index stock_movements_transfer_id_idx on public.stock_movements (transfer_id);
create index stock_movements_adjustment_id_idx on public.stock_movements (adjustment_id);

create or replace function public.set_transfer_reference()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  if new.reference is null or new.reference = '' then
    new.reference = 'WH/INT/' || lpad(nextval('public.transfer_reference_seq')::text, 4, '0');
  end if;
  return new;
end;
$$;

create trigger transfers_set_reference before insert on public.transfers
for each row execute procedure public.set_transfer_reference();

create or replace function public.set_transfer_updated_at()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create trigger transfers_set_updated_at before update on public.transfers
for each row execute procedure public.set_transfer_updated_at();

create or replace function public.set_adjustment_updated_at()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create trigger adjustments_set_updated_at before update on public.adjustments
for each row execute procedure public.set_adjustment_updated_at();

alter table public.transfers enable row level security;
alter table public.transfer_items enable row level security;
alter table public.adjustments enable row level security;
alter table public.adjustment_items enable row level security;

create policy "Authenticated users can view transfers" on public.transfers for select to authenticated using (true);
create policy "Authenticated users can create transfers" on public.transfers for insert to authenticated with check (true);
create policy "Authenticated users can update transfers" on public.transfers for update to authenticated using (true) with check (true);
create policy "Authenticated users can view transfer items" on public.transfer_items for select to authenticated using (true);
create policy "Authenticated users can create transfer items" on public.transfer_items for insert to authenticated with check (true);
create policy "Authenticated users can view adjustments" on public.adjustments for select to authenticated using (true);
create policy "Authenticated users can create adjustments" on public.adjustments for insert to authenticated with check (true);
create policy "Authenticated users can update adjustments" on public.adjustments for update to authenticated using (true) with check (true);
create policy "Authenticated users can view adjustment items" on public.adjustment_items for select to authenticated using (true);
create policy "Authenticated users can create adjustment items" on public.adjustment_items for insert to authenticated with check (true);

create or replace function public.complete_transfer(p_transfer_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  transfer_row public.transfers%rowtype;
  item_row record;
  source_location public.locations%rowtype;
  destination_location public.locations%rowtype;
  source_stock public.stock_levels%rowtype;
  available_quantity numeric;
begin
  select * into transfer_row from public.transfers where id = p_transfer_id for update;
  if not found then raise exception 'Transfer not found'; end if;
  if transfer_row.status = 'done' then raise exception 'Transfer is already done'; end if;
  if transfer_row.status = 'cancelled' then raise exception 'Cancelled transfers cannot be completed'; end if;
  if transfer_row.status <> 'ready' then raise exception 'Transfer must be Ready before completion'; end if;

  select * into source_location from public.locations where id = transfer_row.source_location_id;
  if not found then raise exception 'Source location not found'; end if;
  select * into destination_location from public.locations where id = transfer_row.destination_location_id;
  if not found then raise exception 'Destination location not found'; end if;

  for item_row in select product_id, quantity from public.transfer_items where transfer_id = p_transfer_id order by product_id loop
    select * into source_stock from public.stock_levels
      where product_id = item_row.product_id and location_id = source_location.id for update;
    available_quantity := coalesce(source_stock.quantity - source_stock.reserved_quantity, 0);
    if source_stock.id is null or available_quantity < item_row.quantity then
      raise exception 'Insufficient stock for product %. Available: %, requested: %', item_row.product_id, available_quantity, item_row.quantity;
    end if;

    update public.stock_levels set quantity = quantity - item_row.quantity, updated_at = timezone('utc', now()) where id = source_stock.id;
    insert into public.stock_levels (product_id, location_id, location_name, quantity, reserved_quantity)
      values (item_row.product_id, destination_location.id, destination_location.short_code, item_row.quantity, 0)
      on conflict (product_id, location_name) do update set quantity = public.stock_levels.quantity + excluded.quantity, location_id = excluded.location_id, updated_at = timezone('utc', now());
    insert into public.stock_movements (transfer_id, product_id, location_id, from_location_id, to_location_id, quantity, movement_type)
      values (p_transfer_id, item_row.product_id, source_location.id, source_location.id, destination_location.id, item_row.quantity, 'transfer');
  end loop;

  update public.transfers set status = 'done', updated_at = timezone('utc', now()) where id = p_transfer_id;
end;
$$;

create or replace function public.validate_adjustment(p_adjustment_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  adjustment_row public.adjustments%rowtype;
  item_row record;
  location_row public.locations%rowtype;
  stock_row public.stock_levels%rowtype;
begin
  select * into adjustment_row from public.adjustments where id = p_adjustment_id for update;
  if not found then raise exception 'Adjustment not found'; end if;
  if adjustment_row.status = 'validated' then raise exception 'Adjustment is already validated'; end if;
  if adjustment_row.status = 'cancelled' then raise exception 'Cancelled adjustments cannot be validated'; end if;
  select * into location_row from public.locations where id = adjustment_row.location_id;
  if not found then raise exception 'Adjustment location not found'; end if;

  for item_row in select product_id, current_quantity, counted_quantity, difference from public.adjustment_items where adjustment_id = p_adjustment_id loop
    select * into stock_row from public.stock_levels where product_id = item_row.product_id and location_id = location_row.id for update;
    if item_row.current_quantity <> coalesce(stock_row.quantity, 0) then
      raise exception 'Current quantity changed for product %; refresh and recount', item_row.product_id;
    end if;
    if stock_row.id is null then
      insert into public.stock_levels (product_id, location_id, location_name, quantity, reserved_quantity)
        values (item_row.product_id, location_row.id, location_row.short_code, item_row.counted_quantity, 0);
    else
      update public.stock_levels set quantity = item_row.counted_quantity, updated_at = timezone('utc', now()) where id = stock_row.id;
    end if;
    if item_row.difference <> 0 then
      insert into public.stock_movements (adjustment_id, product_id, location_id, quantity, movement_type)
        values (p_adjustment_id, item_row.product_id, location_row.id, item_row.difference, 'adjustment');
    end if;
  end loop;
  update public.adjustments set status = 'validated', validated_by = auth.uid(), validated_at = timezone('utc', now()), updated_at = timezone('utc', now()) where id = p_adjustment_id;
end;
$$;

grant execute on function public.complete_transfer(uuid) to authenticated;
grant execute on function public.validate_adjustment(uuid) to authenticated;