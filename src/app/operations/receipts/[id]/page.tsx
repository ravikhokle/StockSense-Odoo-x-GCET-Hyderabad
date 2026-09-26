import { notFound } from "next/navigation";

import { ReceiptDetail } from "@/components/receipts/receipt-detail";
import { createClient } from "@/lib/supabase/server";
import type { Receipt, ReceiptItem } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function ReceiptDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: receipt, error: receiptError }, { data: items, error: itemError }] = await Promise.all([
    supabase.from("receipts").select("*, destination_location:locations(*)").eq("id", id).single(),
    supabase.from("receipt_items").select("*, product:products(*)").eq("receipt_id", id),
  ]);
  if (receiptError || itemError || !receipt) notFound();
  return <ReceiptDetail receipt={receipt as Receipt} items={(items ?? []) as ReceiptItem[]} />;
}
