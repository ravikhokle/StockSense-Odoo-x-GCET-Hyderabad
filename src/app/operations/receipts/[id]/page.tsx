import { notFound } from "next/navigation";

import { ReceiptDetail } from "@/components/receipts/receipt-detail";
import { createClient } from "@/lib/supabase/server";
import type { Receipt, ReceiptItem } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function ReceiptDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: receipt, error: receiptError }, { data: items, error: itemError }, { data: locations }] = await Promise.all([
    supabase.from("receipts").select("*, destination_location:locations(*)").eq("id", id).single(),
    supabase.from("receipt_items").select("*, product:products(*)").eq("receipt_id", id),
    supabase.from("locations").select("*").order("name"),
  ]);
  if (receiptError || itemError || !receipt) notFound();
  return <ReceiptDetail receipt={receipt as Receipt} items={(items ?? []) as ReceiptItem[]} locations={locations ?? []} />;
}
