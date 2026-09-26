-- Allow authenticated users to delete records where appropriate

-- Products
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'products' and policyname = 'Authenticated users can delete products'
  ) then
    create policy "Authenticated users can delete products"
      on public.products for delete to authenticated using (true);
  end if;
end $$;

-- Warehouses
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'warehouses' and policyname = 'Authenticated users can delete warehouses'
  ) then
    create policy "Authenticated users can delete warehouses"
      on public.warehouses for delete to authenticated using (true);
  end if;
end $$;

-- Locations
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'locations' and policyname = 'Authenticated users can delete locations'
  ) then
    create policy "Authenticated users can delete locations"
      on public.locations for delete to authenticated using (true);
  end if;
end $$;

-- Receipts
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'receipts' and policyname = 'Authenticated users can delete draft and cancelled receipts'
  ) then
    create policy "Authenticated users can delete draft and cancelled receipts"
      on public.receipts for delete to authenticated using (status in ('draft', 'cancelled'));
  end if;
end $$;

-- Receipt items
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'receipt_items' and policyname = 'Authenticated users can delete receipt items'
  ) then
    create policy "Authenticated users can delete receipt items"
      on public.receipt_items for delete to authenticated using (true);
  end if;
end $$;

-- Deliveries
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'deliveries' and policyname = 'Authenticated users can delete draft and cancelled deliveries'
  ) then
    create policy "Authenticated users can delete draft and cancelled deliveries"
      on public.deliveries for delete to authenticated using (status in ('draft', 'cancelled'));
  end if;
end $$;

-- Delivery items
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'delivery_items' and policyname = 'Authenticated users can delete delivery items'
  ) then
    create policy "Authenticated users can delete delivery items"
      on public.delivery_items for delete to authenticated using (true);
  end if;
end $$;

-- Transfers
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'transfers' and policyname = 'Authenticated users can delete draft and cancelled transfers'
  ) then
    create policy "Authenticated users can delete draft and cancelled transfers"
      on public.transfers for delete to authenticated using (status in ('draft', 'cancelled'));
  end if;
end $$;

-- Transfer items
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'transfer_items' and policyname = 'Authenticated users can delete transfer items'
  ) then
    create policy "Authenticated users can delete transfer items"
      on public.transfer_items for delete to authenticated using (true);
  end if;
end $$;

-- Adjustments
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'adjustments' and policyname = 'Authenticated users can delete draft adjustments'
  ) then
    create policy "Authenticated users can delete draft adjustments"
      on public.adjustments for delete to authenticated using (status in ('draft', 'cancelled'));
  end if;
end $$;

-- Adjustment items
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'adjustment_items' and policyname = 'Authenticated users can delete adjustment items'
  ) then
    create policy "Authenticated users can delete adjustment items"
      on public.adjustment_items for delete to authenticated using (true);
  end if;
end $$;
