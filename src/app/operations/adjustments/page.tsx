import { AdjustmentWorkspace } from "@/components/adjustments/adjustment-workspace";
import { createClient } from "@/lib/supabase/server";
import type { Location, Product, StockLevel } from "@/types/database";

export default async function AdjustmentsPage() {
  const supabase = await createClient();
  const [{ data: products }, { data: locations }, { data: stockLevels }] = await Promise.all([
    supabase.from("products").select("*").order("name"),
    supabase.from("locations").select("*").order("name"),
    supabase.from("stock_levels").select("*").order("product_id"),
  ]);
  return <section className="mx-auto max-w-5xl"><div><p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">Operations</p><h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Adjustments</h1><p className="mt-2 text-sm text-slate-500">Reconcile a physical count and record why stock changed.</p></div><div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8"><AdjustmentWorkspace products={(products ?? []) as Product[]} locations={(locations ?? []) as Location[]} stockLevels={(stockLevels ?? []) as StockLevel[]} /></div></section>;
}
