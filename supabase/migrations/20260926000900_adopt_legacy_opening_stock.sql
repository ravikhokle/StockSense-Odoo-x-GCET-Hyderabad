create or replace function public.adopt_unassigned_stock(p_product_id uuid, p_location_id uuid, p_location_name text)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.stock_levels
  set location_id = p_location_id, location_name = p_location_name, updated_at = timezone('utc', now())
  where product_id = p_product_id and location_id is null
    and not exists (select 1 from public.stock_levels where product_id = p_product_id and location_id = p_location_id);
end;
$$;

create or replace function public.complete_receipt(p_receipt_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare receipt_row public.receipts%rowtype; item_row record; location_row public.locations%rowtype;
begin
  select * into receipt_row from public.receipts where id = p_receipt_id for update;
  if not found then raise exception 'Receipt not found'; end if;
  if receipt_row.status = 'done' then raise exception 'Receipt is already done'; end if;
  if receipt_row.status = 'cancelled' then raise exception 'Cancelled receipts cannot be validated'; end if;
  if receipt_row.status <> 'ready' then raise exception 'Receipt must be Ready before validation'; end if;
  if not exists (select 1 from public.receipt_items where receipt_id = p_receipt_id) then raise exception 'Receipt must contain at least one product'; end if;
  select * into location_row from public.locations where id = receipt_row.destination_location_id;
  if not found then raise exception 'Destination location not found'; end if;
  for item_row in select product_id, quantity from public.receipt_items where receipt_id = p_receipt_id loop
    perform public.adopt_unassigned_stock(item_row.product_id, location_row.id, location_row.short_code);
    insert into public.stock_levels (product_id, location_id, location_name, quantity, reserved_quantity) values (item_row.product_id, location_row.id, location_row.short_code, item_row.quantity, 0)
      on conflict (product_id, location_name) do update set quantity = public.stock_levels.quantity + excluded.quantity, location_id = excluded.location_id, updated_at = timezone('utc', now());
    insert into public.stock_movements (receipt_id, product_id, location_id, quantity) values (p_receipt_id, item_row.product_id, location_row.id, item_row.quantity);
  end loop;
  update public.receipts set status = 'done', updated_at = timezone('utc', now()) where id = p_receipt_id;
end;
$$;

create or replace function public.complete_delivery(p_delivery_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare delivery_row public.deliveries%rowtype; item_row record; location_row public.locations%rowtype; stock_row public.stock_levels%rowtype; available_quantity numeric; product_name text;
begin
  select * into delivery_row from public.deliveries where id = p_delivery_id for update;
  if not found then raise exception 'Delivery not found'; end if;
  if delivery_row.status = 'done' then raise exception 'Delivery is already done'; end if;
  if delivery_row.status = 'cancelled' then raise exception 'Cancelled deliveries cannot be validated'; end if;
  if delivery_row.status <> 'ready' then raise exception 'Delivery must be Ready before validation'; end if;
  if not exists (select 1 from public.delivery_items where delivery_id = p_delivery_id) then raise exception 'Delivery must contain at least one product'; end if;
  select * into location_row from public.locations where id = delivery_row.source_location_id;
  if not found then raise exception 'Source location not found'; end if;
  for item_row in select product_id, quantity from public.delivery_items where delivery_id = p_delivery_id loop
    perform public.adopt_unassigned_stock(item_row.product_id, location_row.id, location_row.short_code);
    select * into stock_row from public.stock_levels where product_id = item_row.product_id and location_id = location_row.id for update;
    select name into product_name from public.products where id = item_row.product_id;
    available_quantity := coalesce(stock_row.quantity - stock_row.reserved_quantity, 0);
    if stock_row.id is null or available_quantity < item_row.quantity then raise exception 'Insufficient stock for %. Available: %, requested: %', product_name, available_quantity, item_row.quantity; end if;
    update public.stock_levels set quantity = quantity - item_row.quantity, updated_at = timezone('utc', now()) where id = stock_row.id;
    insert into public.stock_movements (delivery_id, product_id, location_id, quantity, movement_type) values (p_delivery_id, item_row.product_id, location_row.id, item_row.quantity, 'delivery');
  end loop;
  update public.deliveries set status = 'done', updated_at = timezone('utc', now()) where id = p_delivery_id;
end;
$$;

create or replace function public.complete_transfer(p_transfer_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare transfer_row public.transfers%rowtype; item_row record; source_location public.locations%rowtype; destination_location public.locations%rowtype; source_stock public.stock_levels%rowtype; available_quantity numeric;
begin
  select * into transfer_row from public.transfers where id = p_transfer_id for update;
  if not found then raise exception 'Transfer not found'; end if;
  if transfer_row.status = 'done' then raise exception 'Transfer is already done'; end if;
  if transfer_row.status = 'cancelled' then raise exception 'Cancelled transfers cannot be completed'; end if;
  if transfer_row.status <> 'ready' then raise exception 'Transfer must be Ready before completion'; end if;
  if not exists (select 1 from public.transfer_items where transfer_id = p_transfer_id) then raise exception 'Transfer must contain at least one product'; end if;
  select * into source_location from public.locations where id = transfer_row.source_location_id;
  if not found then raise exception 'Source location not found'; end if;
  select * into destination_location from public.locations where id = transfer_row.destination_location_id;
  if not found then raise exception 'Destination location not found'; end if;
  for item_row in select product_id, quantity from public.transfer_items where transfer_id = p_transfer_id order by product_id loop
    perform public.adopt_unassigned_stock(item_row.product_id, source_location.id, source_location.short_code);
    select * into source_stock from public.stock_levels where product_id = item_row.product_id and location_id = source_location.id for update;
    available_quantity := coalesce(source_stock.quantity - source_stock.reserved_quantity, 0);
    if source_stock.id is null or available_quantity < item_row.quantity then raise exception 'Insufficient stock for product %. Available: %, requested: %', item_row.product_id, available_quantity, item_row.quantity; end if;
    update public.stock_levels set quantity = quantity - item_row.quantity, updated_at = timezone('utc', now()) where id = source_stock.id;
    insert into public.stock_levels (product_id, location_id, location_name, quantity, reserved_quantity) values (item_row.product_id, destination_location.id, destination_location.short_code, item_row.quantity, 0)
      on conflict (product_id, location_name) do update set quantity = public.stock_levels.quantity + excluded.quantity, location_id = excluded.location_id, updated_at = timezone('utc', now());
    insert into public.stock_movements (transfer_id, product_id, location_id, from_location_id, to_location_id, quantity, movement_type) values (p_transfer_id, item_row.product_id, source_location.id, source_location.id, destination_location.id, item_row.quantity, 'transfer');
  end loop;
  update public.transfers set status = 'done', updated_at = timezone('utc', now()) where id = p_transfer_id;
end;
$$;

create or replace function public.validate_adjustment(p_adjustment_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare adjustment_row public.adjustments%rowtype; item_row record; location_row public.locations%rowtype; stock_row public.stock_levels%rowtype;
begin
  select * into adjustment_row from public.adjustments where id = p_adjustment_id for update;
  if not found then raise exception 'Adjustment not found'; end if;
  if adjustment_row.status = 'validated' then raise exception 'Adjustment is already validated'; end if;
  if adjustment_row.status = 'cancelled' then raise exception 'Cancelled adjustments cannot be validated'; end if;
  if not exists (select 1 from public.adjustment_items where adjustment_id = p_adjustment_id) then raise exception 'Adjustment must contain at least one product'; end if;
  select * into location_row from public.locations where id = adjustment_row.location_id;
  if not found then raise exception 'Adjustment location not found'; end if;
  for item_row in select product_id, current_quantity, counted_quantity, difference from public.adjustment_items where adjustment_id = p_adjustment_id loop
    perform public.adopt_unassigned_stock(item_row.product_id, location_row.id, location_row.short_code);
    select * into stock_row from public.stock_levels where product_id = item_row.product_id and location_id = location_row.id for update;
    if item_row.current_quantity <> coalesce(stock_row.quantity, 0) then raise exception 'Current quantity changed for product %; refresh and recount', item_row.product_id; end if;
    if stock_row.id is not null and item_row.counted_quantity < stock_row.reserved_quantity then raise exception 'Counted quantity cannot be below reserved stock for product %', item_row.product_id; end if;
    if stock_row.id is null then insert into public.stock_levels (product_id, location_id, location_name, quantity, reserved_quantity) values (item_row.product_id, location_row.id, location_row.short_code, item_row.counted_quantity, 0); else update public.stock_levels set quantity = item_row.counted_quantity, updated_at = timezone('utc', now()) where id = stock_row.id; end if;
    if item_row.difference <> 0 then insert into public.stock_movements (adjustment_id, product_id, location_id, quantity, movement_type) values (p_adjustment_id, item_row.product_id, location_row.id, item_row.difference, 'adjustment'); end if;
  end loop;
  update public.adjustments set status = 'validated', validated_by = auth.uid(), validated_at = timezone('utc', now()), updated_at = timezone('utc', now()) where id = p_adjustment_id;
end;
$$;

grant execute on function public.adopt_unassigned_stock(uuid, uuid, text) to authenticated;