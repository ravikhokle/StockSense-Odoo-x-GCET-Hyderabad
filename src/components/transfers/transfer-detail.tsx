"use client";

import Link from "next/link";
import { ArrowLeft, Check, Edit3, LoaderCircle, Trash2, X, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { revalidateInventory } from "@/lib/actions/revalidate";
import { createClient } from "@/lib/supabase/client";
import type { Location, Transfer, TransferItem } from "@/types/database";

const labels = { draft: "Draft", ready: "Ready", done: "Done", cancelled: "Cancelled" };
const styles = {
  draft: "bg-slate-100 text-slate-600",
  ready: "bg-amber-50 text-amber-700",
  done: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-rose-50 text-rose-700",
};

export function TransferDetail({
  transfer,
  items,
  locations = [],
}: {
  transfer: Transfer;
  items: TransferItem[];
  locations?: Location[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Edit state
  const [showEdit, setShowEdit] = useState(false);
  const [editSourceId, setEditSourceId] = useState(transfer.source_location_id);
  const [editDestId, setEditDestId] = useState(transfer.destination_location_id);
  const [editDate, setEditDate] = useState(transfer.schedule_date);
  const [editResponsible, setEditResponsible] = useState(transfer.responsible);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete state
  const [showDelete, setShowDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (editSourceId === editDestId) {
      setEditError("Source and destination locations must be different.");
      return;
    }
    setIsSavingEdit(true);
    setEditError(null);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("transfers")
      .update({
        source_location_id: editSourceId,
        destination_location_id: editDestId,
        schedule_date: editDate,
        responsible: editResponsible,
      })
      .eq("id", transfer.id);

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

  async function handleDeleteTransfer() {
    setIsDeleting(true);
    setDeleteError(null);
    const supabase = createClient();
    const { error: delError } = await supabase.from("transfers").delete().eq("id", transfer.id);
    if (delError) {
      setDeleteError(delError.message);
      setIsDeleting(false);
      return;
    }

    await revalidateInventory();
    router.push("/operations/transfers");
    router.refresh();
  }

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

      <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
        {(transfer.status === "draft" || transfer.status === "cancelled") && (
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              setDeleteError(null);
              setShowDelete(true);
            }}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-rose-200 bg-rose-50/50 px-4 text-sm font-semibold text-rose-700 hover:bg-rose-100 transition-colors"
          >
            <Trash2 className="size-4" /> Delete transfer
          </button>
        )}
        {transfer.status === "draft" && (
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              setEditError(null);
              setShowEdit(true);
            }}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Edit3 className="size-4 text-slate-500" /> Edit transfer
          </button>
        )}
        {transfer.status !== "done" && transfer.status !== "cancelled" && (
          <>
            <button
              type="button"
              disabled={loading}
              onClick={() => void action("ready")}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-amber-200 px-4 text-sm font-semibold text-amber-700 hover:bg-amber-50 disabled:opacity-50 transition-colors"
            >
              <Check className="size-4" /> Mark ready
            </button>
            <button
              type="button"
              disabled={loading || transfer.status !== "ready"}
              onClick={() => void action("done")}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {loading && <LoaderCircle className="size-4 animate-spin" />} Complete transfer
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => void action("cancelled")}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-rose-200 px-4 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50 transition-colors"
            >
              <XCircle className="size-4" /> Cancel
            </button>
          </>
        )}
      </div>

      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">Internal transfer</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-950">Edit transfer details</h2>
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
                <span className="text-xs font-bold text-slate-600">Source Location</span>
                <select
                  value={editSourceId}
                  onChange={(e) => setEditSourceId(e.target.value)}
                  required
                  className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500 focus:ring-3 focus:ring-emerald-100"
                >
                  <option value="">Select source location</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.short_code} · {loc.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-bold text-slate-600">Destination Location</span>
                <select
                  value={editDestId}
                  onChange={(e) => setEditDestId(e.target.value)}
                  required
                  className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500 focus:ring-3 focus:ring-emerald-100"
                >
                  <option value="">Select destination location</option>
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
        title={`Delete transfer "${transfer.reference}"?`}
        description="Are you sure you want to permanently delete this internal transfer? This action cannot be undone."
        confirmLabel="Delete transfer"
        isDeleting={isDeleting}
        error={deleteError}
        onConfirm={() => void handleDeleteTransfer()}
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