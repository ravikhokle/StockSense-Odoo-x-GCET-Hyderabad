import { InventorySettings } from "@/components/settings/inventory-settings";
import { createClient } from "@/lib/supabase/server";
import type { Location } from "@/types/database";

export default async function SettingsPage() {
  const { data: locations } = await (await createClient()).from("locations").select("*").order("name");
  return <section className="mx-auto max-w-3xl"><div><p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">Workspace</p><h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Settings</h1><p className="mt-2 text-sm text-slate-500">Keep the inventory workspace aligned with your daily operations.</p></div><div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8"><h2 className="text-base font-bold text-slate-900">Inventory preferences</h2><p className="mt-1 text-sm text-slate-500">These preferences apply to this browser and do not change stock data.</p><div className="mt-6"><InventorySettings locations={(locations ?? []) as Location[]} /></div></div></section>;
}
