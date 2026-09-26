"use client";

import Link from "next/link";
import { Edit3, LoaderCircle, MapPin, Plus, Search, Trash2, Warehouse as WarehouseIcon, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { revalidateInventory } from "@/lib/actions/revalidate";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { warehouseSchema, type WarehouseFormValues } from "@/lib/network/schemas";
import type { Warehouse } from "@/types/database";

function Field({ label, error, ...props }: { label: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-bold text-slate-600">{label}</span>
      <input
        className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-3 focus:ring-emerald-100"
        {...props}
      />
      {error && <span className="block text-xs text-red-600">{error}</span>}
    </label>
  );
}

function WarehouseForm({
  warehouse,
  onClose,
  onSaved,
}: {
  warehouse?: Warehouse;
  onClose: () => void;
  onSaved: () => void;
}) {
  const router = useRouter();
  const form = useForm<WarehouseFormValues>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: {
      name: warehouse?.name ?? "",
      shortCode: warehouse?.short_code ?? "",
      address: warehouse?.address ?? "",
    },
  });
  const [formError, setFormError] = useState<string | null>(null);

  async function submit(values: WarehouseFormValues) {
    setFormError(null);
    const supabase = createClient();
    const result = warehouse
      ? await supabase
          .from("warehouses")
          .update({ name: values.name, short_code: values.shortCode, address: values.address })
          .eq("id", warehouse.id)
      : await supabase
          .from("warehouses")
          .insert({ name: values.name, short_code: values.shortCode, address: values.address });
    if (result.error) {
      setFormError(result.error.code === "23505" ? "That short code is already in use." : result.error.message);
      return;
    }
    await revalidateInventory();
    router.refresh();
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
        <div className="flex justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">Network</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-950">
              {warehouse ? "Edit warehouse" : "Create warehouse"}
            </h2>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="text-slate-400">
            <X className="size-5" />
          </button>
        </div>
        <form className="mt-7 space-y-4" onSubmit={form.handleSubmit(submit)}>
          {formError && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{formError}</p>}
          <Field label="Name" placeholder="Main warehouse" {...form.register("name")} error={form.formState.errors.name?.message} />
          <Field label="Short Code" placeholder="WH" {...form.register("shortCode")} error={form.formState.errors.shortCode?.message} />
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
            <button type="button" onClick={onClose} className="h-10 rounded-lg px-4 text-sm font-semibold text-slate-600">
              Cancel
            </button>
            <button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white disabled:opacity-50"
            >
              {form.formState.isSubmitting && <LoaderCircle className="size-4 animate-spin" />}
              {warehouse ? "Save changes" : "Create warehouse"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function WarehouseList({ initialWarehouses = [] }: { initialWarehouses?: Warehouse[] }) {
  const router = useRouter();
  const [prevWarehouses, setPrevWarehouses] = useState(initialWarehouses);
  const [warehouses, setWarehouses] = useState<Warehouse[]>(initialWarehouses);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Warehouse>();
  const [deletingWarehouse, setDeletingWarehouse] = useState<Warehouse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (initialWarehouses !== prevWarehouses) {
    setPrevWarehouses(initialWarehouses);
    setWarehouses(initialWarehouses);
  }

  async function handleDeleteWarehouse() {
    if (!deletingWarehouse) return;
    setIsDeleting(true);
    setDeleteError(null);
    const supabase = createClient();
    const { error: err } = await supabase.from("warehouses").delete().eq("id", deletingWarehouse.id);
    if (err) {
      if (err.code === "23503") {
        setDeleteError("Cannot delete this warehouse because it has associated locations, stock, or operations.");
      } else {
        setDeleteError(err.message);
      }
      setIsDeleting(false);
      return;
    }
    setDeletingWarehouse(null);
    setIsDeleting(false);
    await revalidateInventory();
    router.refresh();
    void load();
  }

  async function load() {
    if (!hasSupabaseConfig()) {
      setError("Supabase is not configured.");
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error: loadError } = await createClient()
      .from("warehouses")
      .select("*")
      .order("name");
    if (loadError) setError(loadError.message);
    else {
      setWarehouses((data ?? []) as Warehouse[]);
      setError(null);
    }
    setLoading(false);
  }

  const filtered = warehouses.filter((warehouse) =>
    `${warehouse.name} ${warehouse.short_code} ${warehouse.address}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <section className="mx-auto max-w-6xl">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">Network</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">Warehouses</h1>
          <p className="mt-2 text-sm text-slate-500">Manage the facilities that organize your inventory network.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditing(undefined);
            setFormOpen(true);
          }}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white"
        >
          <Plus className="size-4" /> Add warehouse
        </button>
      </div>
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search warehouses"
            className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-emerald-500"
          />
        </div>
      </div>
      {error && <p className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {loading ? (
          <div className="col-span-full flex justify-center py-16">
            <LoaderCircle className="animate-spin text-emerald-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-300 py-16 text-center">
            <WarehouseIcon className="mx-auto size-8 text-slate-300" />
            <p className="mt-3 text-sm font-semibold text-slate-600">No warehouses yet</p>
            <p className="mt-1 text-xs text-slate-400">Create your first warehouse to organize locations.</p>
          </div>
        ) : (
          filtered.map((warehouse) => (
            <div key={warehouse.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <Link href={`/warehouses/${warehouse.id}`} className="flex min-w-0 items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <WarehouseIcon className="size-5" />
                  </span>
                  <span>
                    <span className="block font-bold text-slate-900">{warehouse.name}</span>
                    <span className="block font-mono text-xs text-slate-400">{warehouse.short_code}</span>
                  </span>
                </Link>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label={`Edit ${warehouse.name}`}
                    title={`Edit ${warehouse.name}`}
                    onClick={() => {
                      setEditing(warehouse);
                      setFormOpen(true);
                    }}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                  >
                    <Edit3 className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${warehouse.name}`}
                    title={`Delete ${warehouse.name}`}
                    onClick={() => {
                      setDeleteError(null);
                      setDeletingWarehouse(warehouse);
                    }}
                    className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
              <p className="mt-5 flex items-start gap-2 text-sm leading-5 text-slate-500">
                <MapPin className="mt-0.5 size-4 shrink-0" />
                {warehouse.address}
              </p>
            </div>
          ))
        )}
      </div>
      {formOpen && (
        <WarehouseForm
          warehouse={editing}
          onClose={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false);
            void load();
          }}
        />
      )}
      <DeleteConfirmDialog
        isOpen={Boolean(deletingWarehouse)}
        title={deletingWarehouse ? `Delete "${deletingWarehouse.name}"?` : "Delete warehouse?"}
        description="Are you sure you want to permanently delete this warehouse? All associated locations must be unlinked or removed."
        confirmLabel="Delete warehouse"
        isDeleting={isDeleting}
        error={deleteError}
        onConfirm={() => void handleDeleteWarehouse()}
        onCancel={() => {
          if (!isDeleting) {
            setDeletingWarehouse(null);
            setDeleteError(null);
          }
        }}
      />
    </section>
  );
}
