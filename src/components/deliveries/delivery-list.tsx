"use client";

import Link from "next/link";
import { CalendarDays, ChevronRight, LoaderCircle, Plus, Search, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { revalidateInventory } from "@/lib/actions/revalidate";
import { createClient } from "@/lib/supabase/client";
import type { Delivery } from "@/types/database";

const labels = { draft: "Draft", waiting: "Waiting", ready: "Ready", done: "Done", cancelled: "Cancelled" };
const styles = {
  draft: "bg-slate-100 text-slate-600",
  waiting: "bg-violet-50 text-violet-700",
  ready: "bg-amber-50 text-amber-700",
  done: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-rose-50 text-rose-700",
};

export function DeliveryList({ initialDeliveries = [] }: { initialDeliveries?: Delivery[] }) {
  const router = useRouter();
  const [prevDeliveries, setPrevDeliveries] = useState(initialDeliveries);
  const [deliveries, setDeliveries] = useState<Delivery[]>(initialDeliveries);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [date, setDate] = useState("");
  const [loading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [deletingDelivery, setDeletingDelivery] = useState<Delivery | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (initialDeliveries !== prevDeliveries) {
    setPrevDeliveries(initialDeliveries);
    setDeliveries(initialDeliveries);
  }

  async function handleDeleteDelivery() {
    if (!deletingDelivery) return;
    setIsDeleting(true);
    setDeleteError(null);
    const supabase = createClient();
    const { error: delError } = await supabase.from("deliveries").delete().eq("id", deletingDelivery.id);
    if (delError) {
      setDeleteError(delError.message);
      setIsDeleting(false);
      return;
    }
    setDeliveries((prev) => prev.filter((d) => d.id !== deletingDelivery.id));
    setDeletingDelivery(null);
    setIsDeleting(false);
    await revalidateInventory();
    toast.success("Delivery deleted.");
    router.refresh();
  }

  const filtered = deliveries.filter(
    (delivery) =>
      `${delivery.reference} ${delivery.delivery_address} ${delivery.responsible}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (status === "all" || delivery.status === status) &&
      (!date || delivery.schedule_date === date)
  );

  return (
    <section className="mx-auto max-w-7xl">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">Operations</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Deliveries</h1>
          <p className="mt-2 text-sm text-slate-500">Track outbound delivery orders from draft to fulfillment.</p>
        </div>
        <Link
          href="/operations/deliveries/new"
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
        >
          <Plus className="size-4" /> New delivery
        </Link>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.35)]">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_200px_200px]">
          <label className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search reference, address, contact..."
              className="h-10 w-full rounded-lg border border-slate-200 pl-9 text-sm outline-none focus:border-emerald-500 focus:ring-3 focus:ring-emerald-100"
            />
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-10 rounded-lg border border-slate-200 px-3 text-sm text-slate-600 outline-none focus:border-emerald-500"
          >
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="waiting">Waiting</option>
            <option value="ready">Ready</option>
            <option value="done">Done</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <label className="relative">
            <CalendarDays className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 pl-9 text-sm outline-none focus:border-emerald-500"
            />
          </label>
        </div>
      </div>

      {error && <p className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_-24px_rgba(15,23,42,0.35)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-225 text-left">
            <thead className="border-b border-slate-100 bg-slate-50/80">
              <tr>
                {["Reference", "From", "To", "Contact", "Schedule Date", "Status", "Actions"].map((heading) => (
                  <th key={heading} className="px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <LoaderCircle className="mx-auto animate-spin text-emerald-600" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-sm text-slate-400">
                    No deliveries found.
                  </td>
                </tr>
              ) : (
                filtered.map((delivery) => (
                  <tr key={delivery.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <Link
                        href={`/operations/deliveries/${delivery.id}`}
                        className="font-mono text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                      >
                        {delivery.reference}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-700">
                      {delivery.source_location?.short_code ?? "—"}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">{delivery.delivery_address}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{delivery.responsible}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{delivery.schedule_date}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles[delivery.status]}`}>
                        {labels[delivery.status]}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/operations/deliveries/${delivery.id}`}
                          aria-label={`Open ${delivery.reference}`}
                          title={`Open ${delivery.reference}`}
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                        >
                          <ChevronRight className="size-4" />
                        </Link>
                        {(delivery.status === "draft" || delivery.status === "cancelled") && (
                          <button
                            type="button"
                            aria-label={`Delete ${delivery.reference}`}
                            title={`Delete ${delivery.reference}`}
                            onClick={() => {
                              setDeleteError(null);
                              setDeletingDelivery(delivery);
                            }}
                            className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DeleteConfirmDialog
        isOpen={Boolean(deletingDelivery)}
        title={deletingDelivery ? `Delete delivery "${deletingDelivery.reference}"?` : "Delete delivery?"}
        description="Are you sure you want to permanently delete this delivery order? This action cannot be undone."
        confirmLabel="Delete delivery"
        isDeleting={isDeleting}
        error={deleteError}
        onConfirm={() => void handleDeleteDelivery()}
        onCancel={() => {
          if (!isDeleting) {
            setDeletingDelivery(null);
            setDeleteError(null);
          }
        }}
      />
    </section>
  );
}
