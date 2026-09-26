import { WarehouseList } from "@/components/network/warehouse-list";
import { createClient } from "@/lib/supabase/server";
import type { Warehouse } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function WarehousesPage() {
  const supabase = await createClient();
  const { data: warehouses, error } = await supabase
    .from("warehouses")
    .select("*")
    .order("name");

  if (error) {
    console.error("Error fetching warehouses on server:", error.message);
  }

  return <WarehouseList initialWarehouses={(warehouses ?? []) as Warehouse[]} />;
}
