"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Edit3, LoaderCircle, Trash2, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { createClient } from "@/lib/supabase/client";
import { revalidateInventory } from "@/lib/actions/revalidate";
import { warehouseSchema, type WarehouseFormValues } from "@/lib/network/schemas";
import type { Warehouse } from "@/types/database";

export function WarehouseDetailActions({ warehouse }: { warehouse: Warehouse }) {
  const router = useRouter();
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<WarehouseFormValues>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: {
      name: warehouse.name,
      shortCode: warehouse.short_code,
      address: warehouse.address ?? "",
    },
  });

  async function handleEditSubmit(values: WarehouseFormValues) {
    setFormError(null);
    const supabase = createClient();
    const result = await supabase
      .from("warehouses")
      .update({ name: values.name, short_code: values.shortCode, address: values.address })
      .eq("id", warehouse.id);

    if (result.error) {
      setFormError(result.error.code === "23505" ? "That short code is already in use." : result.error.message);
      return;
    }

    await revalidateInventory();
    setShowEdit(false);
    router.refresh();
  }

  async function handleDelete() {
    setIsDeleting(true);
    setDeleteError(null);
    const supabase = createClient();
    const { error } = await supabase.from("warehouses").delete().eq("id", warehouse.id);

    if (error) {
      if (error.code === "23503") {
        setDeleteError("Cannot delete this warehouse because it has associated locations, stock, or operations.");
      } else {
        setDeleteError(error.message);
      }
      setIsDeleting(false);
      return;
    }

    await revalidateInventory();
    router.push("/warehouses");
    router.refresh();
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowEdit(true)}
          className="inline-flex h-9.5 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
        >
          <Edit3 className="size-4 text-slate-500" /> Edit warehouse
        </button>
        <button
          type="button"
          onClick={() => {
            setDeleteError(null);
            setShowDelete(true);
          }}
          className="inline-flex h-9.5 items-center gap-2 rounded-lg border border-rose-200 bg-rose-50/50 px-3.5 text-sm font-semibold text-rose-700 shadow-sm hover:bg-rose-100 hover:text-rose-800 transition-colors"
        >
          <Trash2 className="size-4 text-rose-500" /> Delete warehouse
        </button>
      </div>

      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">Network</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-950">Edit warehouse</h2>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setShowEdit(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="size-5" />
              </button>
            </div>
            <form className="mt-7 space-y-4" onSubmit={form.handleSubmit(handleEditSubmit)}>
              {formError && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{formError}</p>}
              <label className="block space-y-1.5">
                <span className="text-xs font-bold text-slate-600">Name</span>
                <input
                  className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-3 focus:ring-emerald-100"
                  {...form.register("name")}
                />
                {form.formState.errors.name?.message && (
                  <span className="block text-xs text-red-600">{form.formState.errors.name.message}</span>
                )}
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-bold text-slate-600">Short Code</span>
                <input
                  className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-3 focus:ring-emerald-100"
                  {...form.register("shortCode")}
                />
                {form.formState.errors.shortCode?.message && (
                  <span className="block text-xs text-red-600">{form.formState.errors.shortCode.message}</span>
                )}
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-bold text-slate-600">Address</span>
                <textarea
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-3 focus:ring-emerald-100"
                  placeholder="Warehouse address"
                  {...form.register("address")}
                />
                {form.formState.errors.address?.message && (
                  <span className="block text-xs text-red-600">{form.formState.errors.address.message}</span>
                )}
              </label>
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
                  disabled={form.formState.isSubmitting}
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white disabled:opacity-50 hover:bg-emerald-700"
                >
                  {form.formState.isSubmitting && <LoaderCircle className="size-4 animate-spin" />}
                  Save changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmDialog
        isOpen={showDelete}
        title={`Delete warehouse "${warehouse.name}"?`}
        description="Are you sure you want to permanently delete this warehouse? Locations and stock associated with it must be cleared or reassigned."
        confirmLabel="Delete warehouse"
        isDeleting={isDeleting}
        error={deleteError}
        onConfirm={() => void handleDelete()}
        onCancel={() => {
          if (!isDeleting) {
            setShowDelete(false);
            setDeleteError(null);
          }
        }}
      />
    </>
  );
}
