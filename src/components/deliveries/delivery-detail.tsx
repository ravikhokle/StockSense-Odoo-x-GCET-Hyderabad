"use client";

import Link from "next/link";
import { ArrowLeft, Check, LoaderCircle, Printer, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { revalidateInventory } from "@/lib/actions/revalidate";
import { createClient } from "@/lib/supabase/client";
import type { Delivery, DeliveryItem } from "@/types/database";

const labels = { draft: "Draft", waiting: "Waiting", ready: "Ready", done: "Done", cancelled: "Cancelled" };
const styles = {
  draft: "bg-slate-100 text-slate-600",
  waiting: "bg-violet-50 text-violet-700",
  ready: "bg-amber-50 text-amber-700",
  done: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-rose-50 text-rose-700",
};

export function DeliveryDetail({ delivery, items }: { delivery: Delivery; items: DeliveryItem[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function action(kind: "waiting" | "ready" | "done" | "cancelled") {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const result =
      kind === "done"
        ? await supabase.rpc("complete_delivery", { p_delivery_id: delivery.id })
        : await supabase.from("deliveries").update({ status: kind }).eq("id", delivery.id);
    if (result.error) {
      setError(result.error.message);
    } else {
      await revalidateInventory();
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <section className="receipt-print-sheet mx-auto max-w-5xl print:max-w-none">
      <div className="print:hidden">
        <Link
          href="/operations/deliveries"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-emerald-700"
        >
          <ArrowLeft className="size-4" /> Back to deliveries
        </Link>
      </div>
      <div className="mt-6 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">Outbound delivery</p>
          <h1 className="mt-2 font-mono text-3xl font-bold tracking-tight text-slate-950">
            {delivery.reference}
          </h1>
          <p className="mt-2 text-sm text-slate-500">Scheduled for {delivery.schedule_date}</p>
        </div>
        <span className={`w-fit rounded-full px-3 py-1.5 text-xs font-bold ${styles[delivery.status]}`}>
          {labels[delivery.status]}
        </span>
      </div>
      {error && (
        <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700 print:hidden">
          {error}
        </p>
      )}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Delivery address</p>
          <p className="mt-2 text-sm font-semibold text-slate-800">{delivery.delivery_address}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Source</p>
          <p className="mt-2 text-sm font-semibold text-slate-800">
            {delivery.source_location?.short_code} · {delivery.source_location?.name}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Responsible</p>
          <p className="mt-2 text-sm font-semibold text-slate-800">{delivery.responsible}</p>
        </div>
      </div>
      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Products</h2>
            <p className="mt-1 text-xs text-slate-500">Operation type: {delivery.operation_type}</p>
          </div>
        </div>
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-100">
          <table className="w-full text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">Product</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">SKU</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-400">
                  Quantity
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-700">{item.product?.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{item.product?.sku}</td>
                  <td className="px-4 py-3 text-right text-sm text-slate-700">
                    {item.quantity} {item.product?.unit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap justify-end gap-3 print:hidden">
        {delivery.status !== "cancelled" && delivery.status !== "done" && (
          <button
            type="button"
            disabled={loading}
            onClick={() => void action("cancelled")}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-rose-200 px-4 text-sm font-semibold text-rose-700"
          >
            <XCircle className="size-4" /> Cancel
          </button>
        )}
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700"
        >
          <Printer className="size-4" /> Print
        </button>
        {delivery.status === "draft" && (
          <button
            type="button"
            disabled={loading}
            onClick={() => void action("waiting")}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-violet-600 px-4 text-sm font-semibold text-white"
          >
            Move to waiting
          </button>
        )}
        {delivery.status === "waiting" && (
          <button
            type="button"
            disabled={loading}
            onClick={() => void action("ready")}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-amber-500 px-4 text-sm font-semibold text-white"
          >
            <Check className="size-4" /> Mark ready
          </button>
        )}
        {delivery.status === "ready" && (
          <button
            type="button"
            disabled={loading}
            onClick={() => void action("done")}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white"
          >
            {loading && <LoaderCircle className="size-4 animate-spin" />} Validate delivery
          </button>
        )}
      </div>
    </section>
  );
}
