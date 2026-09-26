import { LocationList } from "@/components/network/location-list";
import { createClient } from "@/lib/supabase/server";
import type { Location, Warehouse } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function LocationsPage() {
  const supabase = await createClient();
  const [
    { data: locationData, error: locationError },
    { data: warehouseData, error: warehouseError },
  ] = await Promise.all([
    supabase.from("locations").select("*, warehouse:warehouses(*)").order("name"),
    supabase.from("warehouses").select("id, name, short_code, address, created_at, updated_at").order("name"),
  ]);

  if (locationError) {
    console.error("Error loading locations on server:", locationError.message);
  }
  if (warehouseError) {
    console.error("Error loading warehouses on server:", warehouseError.message);
  }

  return (
    <LocationList
      initialLocations={(locationData ?? []) as Location[]}
      initialWarehouses={(warehouseData ?? []) as Warehouse[]}
    />
  );
}
