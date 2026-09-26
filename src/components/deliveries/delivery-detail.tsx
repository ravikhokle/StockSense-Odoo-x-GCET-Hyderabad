"use client";

import Link from "next/link";
import { ArrowLeft, Check, Edit3, LoaderCircle, Printer, Trash2, X, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { revalidateInventory } from "@/lib/actions/revalidate";
import { createClient } from "@/lib/supabase/client";
import type { Delivery, DeliveryItem, Location } from "@/types/database";

const labels = { draft: "Draft", waiting: "Waiting", ready: "Ready", done: "Done", cancelled: "Cancelled" };
const styles = {
  draft: "bg-slate-100 text-slate-600",
  waiting: "bg-violet-50 text-violet-700",
  ready: "bg-amber-50 text-amber-700",
  done: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-rose-50 text-rose-700",
};

export function DeliveryDetail({
  delivery,
  items,
  locations = [],
}: {
  delivery: Delivery;
  items: DeliveryItem[];
  locations?: Location[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit state
  const [showEdit, setShowEdit] = useState(false);
  const [editAddress, setEditAddress] = useState(delivery.delivery_address);
  const [editLocationId, setEditLocationId] = useState(delivery.source_location_id);
  const [editDate, setEditDate] = useState(delivery.schedule_date);
  const [editResponsible, setEditResponsible] = useState(delivery.responsible);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete state
  const [showDelete, setShowDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    setIsSavingEdit(true);
    setEditError(null);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("deliveries")
      .update({
        delivery_address: editAddress,
        source_location_id: editLocationId,
        schedule_date: editDate,
        responsible: editResponsible,
      })
      .eq("id", delivery.id);

    if (updateError) {
      setEditError(updateError.message);
      setIsSavingEdit(false);
      return;
    }

    setIsSavingEdit(false);
    setShowEdit(false);
    await revalidateInventory();
    router.refresh();
  }

  async function handleDeleteDelivery() {
    setIsDeleting(true);
    setDeleteError(null);
    const supabase = createClient();
    const { error: delError } = await supabase.from("deliveries").delete().eq("id", delivery.id);
    if (delError) {
      setDeleteError(delError.message);
      setIsDeleting(false);
      return;
    }

    await revalidateInventory();
    router.push("/operations/deliveries");
    router.refresh();
  }

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
      <div className="mt-5 flex flex-wrap items-center justify-end gap-3 print:hidden">
        {(delivery.status === "draft" || delivery.status === "cancelled") && (
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              setDeleteError(null);
              setShowDelete(true);
            }}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-rose-200 bg-rose-50/50 px-4 text-sm font-semibold text-rose-700 hover:bg-rose-100 transition-colors"
          >
            <Trash2 className="size-4" /> Delete delivery
          </button>
        )}
        {delivery.status === "draft" && (
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              setEditError(null);
              setShowEdit(true);
            }}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Edit3 className="size-4 text-slate-500" /> Edit delivery
          </button>
        )}
        {delivery.status !== "cancelled" && delivery.status !== "done" && (
          <button
            type="button"
            disabled={loading}
            onClick={() => void action("cancelled")}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-rose-200 px-4 text-sm font-semibold text-rose-700 hover:bg-rose-50 transition-colors"
          >
            <XCircle className="size-4" /> Cancel
          </button>
        )}
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <Printer className="size-4" /> Print
        </button>
        {delivery.status === "draft" && (
          <button
            type="button"
            disabled={loading}
            onClick={() => void action("waiting")}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-violet-600 px-4 text-sm font-semibold text-white hover:bg-violet-700 transition-colors"
          >
            Move to waiting
          </button>
        )}
        {delivery.status === "waiting" && (
          <button
            type="button"
            disabled={loading}
            onClick={() => void action("ready")}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-amber-500 px-4 text-sm font-semibold text-white hover:bg-amber-600 transition-colors"
          >
            <Check className="size-4" /> Mark ready
          </button>
        )}
        {delivery.status === "ready" && (
          <button
            type="button"
            disabled={loading}
            onClick={() => void action("done")}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
          >
            {loading && <LoaderCircle className="size-4 animate-spin" />} Validate delivery
          </button>
        )}
      </div>

      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">Outbound delivery</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-950">Edit delivery details</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowEdit(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="size-5" />
              </button>
            </div>
            <form className="mt-6 space-y-4" onSubmit={handleSaveEdit}>
              {editError && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{editError}</p>}
              <label className="block space-y-1.5">
                <span className="text-xs font-bold text-slate-600">Destination / Delivery Address</span>
                <input
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  required
                  placeholder="123 Industrial Way, Suite A"
                  className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500 focus:ring-3 focus:ring-emerald-100"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-bold text-slate-600">Source Location</span>
                <select
                  value={editLocationId}
                  onChange={(e) => setEditLocationId(e.target.value)}
                  required
                  className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500 focus:ring-3 focus:ring-emerald-100"
                >
                  <option value="">Select location</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.short_code} · {loc.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block space-y-1.5">
                  <span className="text-xs font-bold text-slate-600">Schedule Date</span>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    required
                    className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500 focus:ring-3 focus:ring-emerald-100"
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-bold text-slate-600">Responsible Person</span>
                  <input
                    value={editResponsible}
                    onChange={(e) => setEditResponsible(e.target.value)}
                    required
                    placeholder="Jane Doe"
                    className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500 focus:ring-3 focus:ring-emerald-100"
                  />
                </label>
              </div>
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={() => setShowEdit(false)}
                  className="h-10 rounded-lg px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {isSavingEdit && <LoaderCircle className="size-4 animate-spin" />} Save changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmDialog
        isOpen={showDelete}
        title={`Delete delivery "${delivery.reference}"?`}
        description="Are you sure you want to permanently delete this delivery order and all its items? This action cannot be undone."
        confirmLabel="Delete delivery"
        isDeleting={isDeleting}
        error={deleteError}
        onConfirm={() => void handleDeleteDelivery()}
        onCancel={() => {
          if (!isDeleting) {
            setShowDelete(false);
            setDeleteError(null);
          }
        }}
      />
    </section>
  );
}
