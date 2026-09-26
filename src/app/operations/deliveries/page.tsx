import { DeliveryList } from "@/components/deliveries/delivery-list";
import { createClient } from "@/lib/supabase/server";
import type { Delivery } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function DeliveriesPage() {
  const supabase = await createClient();
  const { data: deliveries, error } = await supabase
    .from("deliveries")
    .select("*, source_location:locations(*)")
    .order("schedule_date", { ascending: false });

  if (error) {
    console.error("Error fetching deliveries on server:", error.message);
  }

  return <DeliveryList initialDeliveries={(deliveries ?? []) as Delivery[]} />;
}
