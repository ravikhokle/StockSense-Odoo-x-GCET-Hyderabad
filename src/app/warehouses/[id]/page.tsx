import Link from "next/link";
import { ArrowLeft, MapPin, Package, Warehouse as WarehouseIcon } from "lucide-react";
import { notFound } from "next/navigation";

import { WarehouseDetailActions } from "@/components/network/warehouse-detail-actions";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function WarehouseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: warehouse, error: warehouseError }, { data: locations }] = await Promise.all([
    supabase.from("warehouses").select("*").eq("id", id).single(),
    supabase.from("locations").select("*").eq("warehouse_id", id).order("name"),
  ]);
  if (warehouseError || !warehouse) notFound();

  const locationIds = locations?.map((l) => l.id) ?? [];
  const { data: stockLevels } =
    locationIds.length > 0
      ? await supabase.from("stock_levels").select("quantity, reserved_quantity, location_id").in("location_id", locationIds)
      : { data: [] };

  const stock = (stockLevels ?? []).reduce((sum, level) => sum + Number(level.quantity), 0);
  const available = (stockLevels ?? []).reduce(
    (sum, level) => sum + Number(level.quantity) - Number(level.reserved_quantity),
    0
  );

  return (
    <section className="mx-auto max-w-6xl">
      <Link
        href="/warehouses"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-emerald-700"
      >
        <ArrowLeft className="size-4" /> Back to warehouses
      </Link>
      <div className="mt-6 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div className="flex items-start gap-4">
          <span className="flex size-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <WarehouseIcon className="size-6" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">Warehouse detail</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{warehouse.name}</h1>
            <p className="mt-1 font-mono text-sm text-slate-500">{warehouse.short_code}</p>
          </div>
        </div>
        <WarehouseDetailActions warehouse={warehouse} />
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Locations</p>
          <p className="mt-4 text-3xl font-bold text-slate-950">{locations?.length ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Stock on hand</p>
          <p className="mt-4 text-3xl font-bold text-slate-950">{stock}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Available</p>
          <p className="mt-4 text-3xl font-bold text-emerald-600">{available}</p>
        </div>
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-base font-bold text-slate-900">Warehouse information</h2>
          <p className="mt-5 flex gap-2 text-sm leading-6 text-slate-600">
            <MapPin className="mt-1 size-4 shrink-0 text-slate-400" />
            {warehouse.address}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-base font-bold text-slate-900">Locations</h2>
          <div className="mt-4 space-y-2">
            {locations?.length ? (
              locations.map((location) => (
                <div key={location.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                  <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <MapPin className="size-4 text-slate-400" />
                    {location.name}
                  </span>
                  <span className="font-mono text-xs text-slate-400">{location.short_code}</span>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-sm text-slate-400">
                <Package className="mx-auto size-7 text-slate-300" />
                <p className="mt-2">No locations configured.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
