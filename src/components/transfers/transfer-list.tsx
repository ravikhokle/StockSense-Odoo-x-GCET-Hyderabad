"use client";

import Link from "next/link";
import { ChevronRight, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { revalidateInventory } from "@/lib/actions/revalidate";
import { createClient } from "@/lib/supabase/client";
import type { Transfer } from "@/types/database";

const labels = { draft: "Draft", ready: "Ready", done: "Done", cancelled: "Cancelled" };
const styles = {
  draft: "bg-slate-100 text-slate-600",
  ready: "bg-amber-50 text-amber-700",
  done: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-rose-50 text-rose-700",
};

export function TransferList({ initialTransfers = [] }: { initialTransfers?: Transfer[] }) {
  const router = useRouter();
  const [prevTransfers, setPrevTransfers] = useState(initialTransfers);
  const [transfers, setTransfers] = useState<Transfer[]>(initialTransfers);
  const [error] = useState<string | null>(null);

  const [deletingTransfer, setDeletingTransfer] = useState<Transfer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (initialTransfers !== prevTransfers) {
    setPrevTransfers(initialTransfers);
    setTransfers(initialTransfers);
  }

  async function handleDeleteTransfer() {
    if (!deletingTransfer) return;
    setIsDeleting(true);
    setDeleteError(null);
    const supabase = createClient();
    const { error: delError } = await supabase.from("transfers").delete().eq("id", deletingTransfer.id);
    if (delError) {
      setDeleteError(delError.message);
      setIsDeleting(false);
      return;
    }
    setTransfers((prev) => prev.filter((t) => t.id !== deletingTransfer.id));
    setDeletingTransfer(null);
    setIsDeleting(false);
    await revalidateInventory();
    router.refresh();
  }

  return (
    <section className="mx-auto max-w-7xl">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">Operations</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Internal transfers</h1>
          <p className="mt-2 text-sm text-slate-500">Move stock between locations without changing total inventory.</p>
        </div>
        <Link
          href="/operations/transfers/new"
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
        >
          <Plus className="size-4" /> New transfer
        </Link>
      </div>
      {error && <p className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_-24px_rgba(15,23,42,0.35)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-175 text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-bold uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-5 py-4">Reference</th>
                <th className="px-5 py-4">Route</th>
                <th className="px-5 py-4">Responsible</th>
                <th className="px-5 py-4">Schedule</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transfers.map((transfer) => (
                <tr key={transfer.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-4 font-mono font-semibold text-slate-800">
                    <Link href={`/operations/transfers/${transfer.id}`} className="hover:text-emerald-700">
                      {transfer.reference}
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {transfer.source_location?.short_code} → {transfer.destination_location?.short_code}
                  </td>
                  <td className="px-5 py-4 text-slate-600">{transfer.responsible}</td>
                  <td className="px-5 py-4 text-slate-600">{transfer.schedule_date}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${styles[transfer.status]}`}>
                      {labels[transfer.status]}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/operations/transfers/${transfer.id}`}
                        aria-label={`Open ${transfer.reference}`}
                        title={`Open ${transfer.reference}`}
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                      >
                        <ChevronRight className="size-4" />
                      </Link>
                      {(transfer.status === "draft" || transfer.status === "cancelled") && (
                        <button
                          type="button"
                          aria-label={`Delete ${transfer.reference}`}
                          title={`Delete ${transfer.reference}`}
                          onClick={() => {
                            setDeleteError(null);
                            setDeletingTransfer(transfer);
                          }}
                          className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {transfers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-500">
                    No transfers yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DeleteConfirmDialog
        isOpen={Boolean(deletingTransfer)}
        title={deletingTransfer ? `Delete transfer "${deletingTransfer.reference}"?` : "Delete transfer?"}
        description="Are you sure you want to permanently delete this internal transfer? This action cannot be undone."
        confirmLabel="Delete transfer"
        isDeleting={isDeleting}
        error={deleteError}
        onConfirm={() => void handleDeleteTransfer()}
        onCancel={() => {
          if (!isDeleting) {
            setDeletingTransfer(null);
            setDeleteError(null);
          }
        }}
      />
    </section>
  );
}