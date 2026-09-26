import { notFound } from "next/navigation";

import { TransferDetail } from "@/components/transfers/transfer-detail";
import { createClient } from "@/lib/supabase/server";
import type { Transfer, TransferItem } from "@/types/database";

export default async function TransferDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: transfer }, { data: items }] = await Promise.all([
    supabase.from("transfers").select("*, source_location:locations!transfers_source_location_id_fkey(*), destination_location:locations!transfers_destination_location_id_fkey(*)").eq("id", id).single(),
    supabase.from("transfer_items").select("*, product:products(*)").eq("transfer_id", id),
  ]);
  if (!transfer) notFound();
  return <TransferDetail transfer={transfer as Transfer} items={(items ?? []) as TransferItem[]} />;
}