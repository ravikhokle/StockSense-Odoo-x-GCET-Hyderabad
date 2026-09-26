create sequence public.receipt_reference_seq;

create table public.receipts (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  vendor_name text not null,
  destination_location_id uuid not null references public.locations(id) on delete restrict,
  schedule_date date not null,
  responsible text not null,
  status text not null default 'draft' check (status in ('draft', 'ready', 'done', 'cancelled')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index receipts_status_idx on public.receipts (status);
create index receipts_schedule_date_idx on public.receipts (schedule_date);
create index receipts_destination_location_id_idx on public.receipts (destination_location_id);

create table public.receipt_items (
  id uuid primary key default gen_random_uuid(),
  receipt_id uuid not null references public.receipts(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity numeric(14, 3) not null check (quantity > 0),
  created_at timestamptz not null default timezone('utc', now()),
  unique (receipt_id, product_id)
);

create index receipt_items_receipt_id_idx on public.receipt_items (receipt_id);
create index receipt_items_product_id_idx on public.receipt_items (product_id);

create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  receipt_id uuid not null references public.receipts(id) on delete restrict,
  product_id uuid not null references public.products(id) on delete restrict,
  location_id uuid not null references public.locations(id) on delete restrict,
  quantity numeric(14, 3) not null check (quantity > 0),
  movement_type text not null default 'receipt' check (movement_type = 'receipt'),
  created_at timestamptz not null default timezone('utc', now())
);

create index stock_movements_receipt_id_idx on public.stock_movements (receipt_id);
create index stock_movements_product_id_idx on public.stock_movements (product_id);
create index stock_movements_location_id_idx on public.stock_movements (location_id);

create or replace function public.set_receipt_reference()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.reference is null or new.reference = '' then
    new.reference = 'WH/IN/' || lpad(nextval('public.receipt_reference_seq')::text, 4, '0');
  end if;
  return new;
end;
$$;

create trigger receipts_set_reference before insert on public.receipts
for each row execute procedure public.set_receipt_reference();

create or replace function public.set_receipt_updated_at()
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

create trigger receipts_set_updated_at before update on public.receipts
for each row execute procedure public.set_receipt_updated_at();

alter table public.receipts enable row level security;
alter table public.receipt_items enable row level security;
alter table public.stock_movements enable row level security;

create policy "Authenticated users can view receipts"
  on public.receipts for select to authenticated using (true);
create policy "Authenticated users can create receipts"
  on public.receipts for insert to authenticated with check (true);
create policy "Authenticated users can update receipts"
  on public.receipts for update to authenticated using (true) with check (true);

create policy "Authenticated users can view receipt items"
  on public.receipt_items for select to authenticated using (true);
create policy "Authenticated users can create receipt items"
  on public.receipt_items for insert to authenticated with check (true);

create policy "Authenticated users can view stock movements"
  on public.stock_movements for select to authenticated using (true);

create or replace function public.complete_receipt(p_receipt_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  receipt_row public.receipts%rowtype;
  item_row record;
  location_row public.locations%rowtype;
begin
  select * into receipt_row from public.receipts where id = p_receipt_id for update;
  if not found then raise exception 'Receipt not found'; end if;
  if receipt_row.status = 'done' then raise exception 'Receipt is already done'; end if;
  if receipt_row.status = 'cancelled' then raise exception 'Cancelled receipts cannot be validated'; end if;
  if receipt_row.status <> 'ready' then raise exception 'Receipt must be Ready before validation'; end if;

  select * into location_row from public.locations where id = receipt_row.destination_location_id;
  if not found then raise exception 'Destination location not found'; end if;

  for item_row in select product_id, quantity from public.receipt_items where receipt_id = p_receipt_id loop
    insert into public.stock_levels (product_id, location_id, location_name, quantity, reserved_quantity)
    values (item_row.product_id, location_row.id, location_row.short_code, item_row.quantity, 0)
    on conflict (product_id, location_name) do update
      set quantity = public.stock_levels.quantity + excluded.quantity,
          location_id = excluded.location_id,
          updated_at = timezone('utc', now());

    insert into public.stock_movements (receipt_id, product_id, location_id, quantity)
    values (p_receipt_id, item_row.product_id, location_row.id, item_row.quantity);
  end loop;

  update public.receipts set status = 'done', updated_at = timezone('utc', now()) where id = p_receipt_id;
end;
$$;

grant execute on function public.complete_receipt(uuid) to authenticated;
