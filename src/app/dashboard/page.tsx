import { DashboardView } from "@/components/dashboard/dashboard-view";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [
    { data: products, error: productsError },
    { data: stockLevels, error: stockError },
    { data: receipts, error: receiptsError },
    { data: deliveries, error: deliveriesError },
    { data: transfers, error: transfersError },
    { data: categories, error: categoriesError },
    { data: warehouses, error: warehousesError },
    { data: locations, error: locationsError },
  ] = await Promise.all([
    supabase.from("products").select("id, name, sku, category_id, reorder_level"),
    supabase.from("stock_levels").select("id, product_id, location_id, location_name, quantity, reserved_quantity"),
    supabase.from("receipts").select("id, reference, status, destination_location_id, vendor_name"),
    supabase.from("deliveries").select("id, reference, status, source_location_id, delivery_address"),
    supabase.from("transfers").select("id, reference, status, source_location_id, destination_location_id"),
    supabase.from("categories").select("id, name").order("name"),
    supabase.from("warehouses").select("id, name, short_code").order("name"),
    supabase.from("locations").select("id, name, short_code, warehouse_id").order("name"),
  ]);

  if (productsError) console.error("Error fetching products for dashboard:", productsError.message);
  if (stockError) console.error("Error fetching stock levels for dashboard:", stockError.message);
  if (receiptsError) console.error("Error fetching receipts for dashboard:", receiptsError.message);
  if (deliveriesError) console.error("Error fetching deliveries for dashboard:", deliveriesError.message);
  if (transfersError) console.error("Error fetching transfers for dashboard:", transfersError.message);
  if (categoriesError) console.error("Error fetching categories for dashboard:", categoriesError.message);
  if (warehousesError) console.error("Error fetching warehouses for dashboard:", warehousesError.message);
  if (locationsError) console.error("Error fetching locations for dashboard:", locationsError.message);

  return (
    <DashboardView
      products={products ?? []}
      stockLevels={stockLevels ?? []}
      receipts={receipts ?? []}
      deliveries={deliveries ?? []}
      transfers={transfers ?? []}
      categories={categories ?? []}
      warehouses={warehouses ?? []}
      locations={locations ?? []}
    />
  );
}