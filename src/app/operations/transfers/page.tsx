import { TransferList } from "@/components/transfers/transfer-list";
import { createClient } from "@/lib/supabase/server";
import type { Transfer } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function TransfersPage() {
  const supabase = await createClient();
  const { data: transfers, error } = await supabase
    .from("transfers")
    .select(
      "*, source_location:locations!transfers_source_location_id_fkey(*), destination_location:locations!transfers_destination_location_id_fkey(*)"
    )
    .order("schedule_date", { ascending: false });

  if (error) {
    console.error("Error fetching transfers on server:", error.message);
  }

  return <TransferList initialTransfers={(transfers ?? []) as Transfer[]} />;
}
