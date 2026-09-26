import { notFound } from "next/navigation";

import { DeliveryDetail } from "@/components/deliveries/delivery-detail";
import { createClient } from "@/lib/supabase/server";
import type { Delivery, DeliveryItem } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function DeliveryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: delivery, error: deliveryError }, { data: items, error: itemError }] = await Promise.all([
    supabase.from("deliveries").select("*, source_location:locations(*)").eq("id", id).single(),
    supabase.from("delivery_items").select("*, product:products(*)").eq("delivery_id", id),
  ]);
  if (deliveryError || itemError || !delivery) notFound();
  return <DeliveryDetail delivery={delivery as Delivery} items={(items ?? []) as DeliveryItem[]} />;
}
