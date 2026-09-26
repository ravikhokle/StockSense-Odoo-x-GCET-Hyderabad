"use client";

import Link from "next/link";
import { CalendarDays, ChevronRight, Edit3, LoaderCircle, Plus, Search, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { revalidateInventory } from "@/lib/actions/revalidate";
import { createClient } from "@/lib/supabase/client";

import type { Receipt } from "@/types/database";

const statusStyles: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600",
  ready: "bg-amber-50 text-amber-700",
  done: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-rose-50 text-rose-700",
};
const statusLabel: Record<string, string> = {
  draft: "Draft",
  ready: "Ready",
  done: "Done",
  cancelled: "Cancelled",
};

export function ReceiptList({ initialReceipts = [] }: { initialReceipts?: Receipt[] }) {
  const router = useRouter();
  const [prevReceipts, setPrevReceipts] = useState(initialReceipts);
  const [receipts, setReceipts] = useState<Receipt[]>(initialReceipts);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [date, setDate] = useState("");
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);

  const [deletingReceipt, setDeletingReceipt] = useState<Receipt | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (initialReceipts !== prevReceipts) {
    setPrevReceipts(initialReceipts);
    setReceipts(initialReceipts);
  }

  async function handleDeleteReceipt() {
    if (!deletingReceipt) return;
    setIsDeleting(true);
    setDeleteError(null);
    const supabase = createClient();
    const { error: delError } = await supabase.from("receipts").delete().eq("id", deletingReceipt.id);
    if (delError) {
      setDeleteError(delError.message);
      setIsDeleting(false);
      return;
    }
    setReceipts((prev) => prev.filter((r) => r.id !== deletingReceipt.id));
    setDeletingReceipt(null);
    setIsDeleting(false);
    await revalidateInventory();
    toast.success("Receipt deleted.");
    router.refresh();
  }

  const filtered = receipts.filter(
    (receipt) =>
      `${receipt.reference} ${receipt.vendor_name} ${receipt.responsible}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (status === "all" || receipt.status === status) &&
      (!date || receipt.schedule_date === date)
  );

  return (
    <section className="mx-auto max-w-7xl">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">Operations</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Receipts</h1>
          <p className="mt-2 text-sm text-slate-500">Track inbound inventory from schedule to completion.</p>
        </div>
        <Link
          href="/operations/receipts/new"
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white"
        >
          <Plus className="size-4" /> New receipt
        </Link>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_190px_190px]">
          <label className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search references or vendors"
              className="h-10 w-full rounded-lg border border-slate-200 pl-9 text-sm outline-none focus:border-emerald-500"
            />
          </label>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500"
          >
            <option value="all">All statuses</option>
            {Object.entries(statusLabel).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <label className="relative">
            <CalendarDays className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 pl-9 text-sm outline-none focus:border-emerald-500"
            />
          </label>
        </div>
      </div>

      {error && <p className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-225 text-left">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                {["Reference", "From", "To", "Contact", "Schedule Date", "Status", ""].map((heading) => (
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
                    No receipts found.
                  </td>
                </tr>
              ) : (
                filtered.map((receipt) => (
                  <tr key={receipt.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <Link
                        href={`/operations/receipts/${receipt.id}`}
                        className="font-mono text-sm font-semibold text-emerald-700"
                      >
                        {receipt.reference}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-700">{receipt.vendor_name}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {receipt.destination_location?.short_code ?? "—"}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">{receipt.responsible}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{receipt.schedule_date}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          statusStyles[receipt.status]
                        }`}
                      >
                        {statusLabel[receipt.status]}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/operations/receipts/${receipt.id}`}
                          aria-label={`Open ${receipt.reference}`}
                          title={`Open ${receipt.reference}`}
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                        >
                          <ChevronRight className="size-4" />
                        </Link>
                        {(receipt.status === "draft" || receipt.status === "cancelled") && (
                          <button
                            type="button"
                            aria-label={`Delete ${receipt.reference}`}
                            title={`Delete ${receipt.reference}`}
                            onClick={() => {
                              setDeleteError(null);
                              setDeletingReceipt(receipt);
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
        isOpen={Boolean(deletingReceipt)}
        title={deletingReceipt ? `Delete receipt "${deletingReceipt.reference}"?` : "Delete receipt?"}
        description="Are you sure you want to delete this receipt? This action cannot be undone."
        confirmLabel="Delete receipt"
        isDeleting={isDeleting}
        error={deleteError}
        onConfirm={() => void handleDeleteReceipt()}
        onCancel={() => {
          if (!isDeleting) {
            setDeletingReceipt(null);
            setDeleteError(null);
          }
        }}
      />
    </section>
  );
}
