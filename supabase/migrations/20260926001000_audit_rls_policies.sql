-- Audit and complete Row Level Security policies

-- Allow authenticated users to update stock levels
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'stock_levels' and policyname = 'Authenticated users can update stock levels'
  ) then
    create policy "Authenticated users can update stock levels"
      on public.stock_levels for update to authenticated using (true) with check (true);
  end if;
end $$;

-- Allow authenticated users to insert stock movements
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'stock_movements' and policyname = 'Authenticated users can insert stock movements'
  ) then
    create policy "Authenticated users can insert stock movements"
      on public.stock_movements for insert to authenticated with check (true);
  end if;
end $$;
