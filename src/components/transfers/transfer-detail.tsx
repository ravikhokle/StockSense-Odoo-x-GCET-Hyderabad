"use client";

import Link from "next/link";
import { ArrowLeft, Check, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { revalidateInventory } from "@/lib/actions/revalidate";
import { createClient } from "@/lib/supabase/client";
import type { Transfer, TransferItem } from "@/types/database";

const labels = { draft: "Draft", ready: "Ready", done: "Done", cancelled: "Cancelled" };
const styles = {
  draft: "bg-slate-100 text-slate-600",
  ready: "bg-amber-50 text-amber-700",
  done: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-rose-50 text-rose-700",
};

export function TransferDetail({ transfer, items }: { transfer: Transfer; items: TransferItem[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function action(kind: "ready" | "done" | "cancelled") {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const result =
      kind === "done"
        ? await supabase.rpc("complete_transfer", { p_transfer_id: transfer.id })
        : await supabase.from("transfers").update({ status: kind }).eq("id", transfer.id);
    if (result.error) {
      setError(result.error.message);
    } else {
      await revalidateInventory();
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <section className="mx-auto max-w-5xl">
      <Link
        href="/operations/transfers"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-emerald-700"
      >
        <ArrowLeft className="size-4" /> Back to transfers
      </Link>
      <div className="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">Internal transfer</p>
          <h1 className="mt-2 font-mono text-3xl font-bold tracking-tight text-slate-950">
            {transfer.reference}
          </h1>
          <p className="mt-2 text-sm text-slate-500">Scheduled for {transfer.schedule_date}</p>
        </div>
        <span className={`w-fit rounded-full px-3 py-1.5 text-xs font-bold ${styles[transfer.status]}`}>
          {labels[transfer.status]}
        </span>
      </div>
      {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Source</p>
          <p className="mt-2 text-sm font-semibold text-slate-800">
            {transfer.source_location?.short_code} · {transfer.source_location?.name}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Destination</p>
          <p className="mt-2 text-sm font-semibold text-slate-800">
            {transfer.destination_location?.short_code} · {transfer.destination_location?.name}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Responsible</p>
          <p className="mt-2 text-sm font-semibold text-slate-800">{transfer.responsible}</p>
        </div>
      </div>
      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-base font-bold text-slate-900">Products</h2>
        <div className="mt-4 divide-y divide-slate-100">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-3 text-sm">
              <span className="font-semibold text-slate-800">{item.product?.name ?? item.product_id}</span>
              <span className="text-slate-500">
                {item.quantity} {item.product?.unit ?? "units"}
              </span>
            </div>
          ))}
        </div>
      </div>
      {transfer.status !== "done" && transfer.status !== "cancelled" && (
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            disabled={loading}
            onClick={() => void action("ready")}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-amber-200 px-4 text-sm font-semibold text-amber-700 disabled:opacity-50"
          >
            <Check className="size-4" /> Mark ready
          </button>
          <button
            disabled={loading || transfer.status !== "ready"}
            onClick={() => void action("done")}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            <Check className="size-4" /> Complete transfer
          </button>
          <button
            disabled={loading}
            onClick={() => void action("cancelled")}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-rose-200 px-4 text-sm font-semibold text-rose-700 disabled:opacity-50"
          >
            <XCircle className="size-4" /> Cancel
          </button>
        </div>
      )}
    </section>
  );
}