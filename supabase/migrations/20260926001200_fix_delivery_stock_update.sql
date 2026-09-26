create or replace function public.complete_delivery(p_delivery_id uuid)
returns void language plpgsql security definer set search_path = public as $$
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
  if not exists (select 1 from public.delivery_items where delivery_id = p_delivery_id) then raise exception 'Delivery must contain at least one product'; end if;

  select * into location_row from public.locations where id = delivery_row.source_location_id;
  if not found then raise exception 'Source location not found'; end if;

  for item_row in select product_id, quantity from public.delivery_items where delivery_id = p_delivery_id loop
    select * into stock_row
    from public.stock_levels
    where product_id = item_row.product_id and location_id = location_row.id
    for update;

    if not found then
      select * into stock_row
      from public.stock_levels
      where product_id = item_row.product_id
        and location_name = location_row.short_code
        and location_id is null
      for update;
    end if;

    select name into product_name from public.products where id = item_row.product_id;
    available_quantity := coalesce(stock_row.quantity - stock_row.reserved_quantity, 0);
    if stock_row.id is null or available_quantity < item_row.quantity then
      raise exception 'Insufficient stock for %. Available: %, requested: %', product_name, available_quantity, item_row.quantity;
    end if;

    update public.stock_levels
    set quantity = quantity - item_row.quantity,
        location_id = coalesce(location_id, location_row.id),
        location_name = location_row.short_code,
        updated_at = timezone('utc', now())
    where id = stock_row.id;

    insert into public.stock_movements (delivery_id, product_id, location_id, quantity, movement_type)
    values (p_delivery_id, item_row.product_id, location_row.id, item_row.quantity, 'delivery');
  end loop;

  update public.deliveries
  set status = 'done', updated_at = timezone('utc', now())
  where id = p_delivery_id;
end;
$$;

grant execute on function public.complete_delivery(uuid) to authenticated;
