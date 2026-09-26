import { ReceiptList } from "@/components/receipts/receipt-list";
import { createClient } from "@/lib/supabase/server";
import type { Receipt } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function ReceiptsPage() {
  const supabase = await createClient();
  const { data: receipts, error } = await supabase
    .from("receipts")
    .select("*, destination_location:locations(*)")
    .order("schedule_date", { ascending: false });

  if (error) {
    console.error("Error fetching receipts on server:", error.message);
  }

  return <ReceiptList initialReceipts={(receipts ?? []) as Receipt[]} />;
}
