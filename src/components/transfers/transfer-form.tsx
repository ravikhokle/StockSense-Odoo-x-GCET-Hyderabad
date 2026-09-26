"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

import { revalidateInventory } from "@/lib/actions/revalidate";
import { transferSchema, type TransferFormValues } from "@/lib/transfers/schemas";
import { createClient } from "@/lib/supabase/client";
import type { Location, Product } from "@/types/database";

export function TransferForm({ products, locations }: { products: Product[]; locations: Location[] }) {
  const router = useRouter();
  const form = useForm<z.input<typeof transferSchema>, unknown, TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      sourceLocationId: "",
      destinationLocationId: "",
      responsible: "",
      scheduleDate: new Date().toISOString().slice(0, 10),
      items: [{ productId: "", quantity: 1 }],
    },
  });
  const items = useFieldArray({ control: form.control, name: "items" });

  async function submit(values: TransferFormValues) {
    const supabase = createClient();
    const { data: transfer, error } = await supabase
      .from("transfers")
      .insert({
        reference: "",
        source_location_id: values.sourceLocationId,
        destination_location_id: values.destinationLocationId,
        responsible: values.responsible,
        schedule_date: values.scheduleDate,
        status: "draft",
      })
      .select("id")
      .single();
    if (error || !transfer) {
      form.setError("root", { message: error?.message ?? "Could not create transfer." });
      return;
    }
    const { error: itemError } = await supabase
      .from("transfer_items")
      .insert(values.items.map((item) => ({ transfer_id: transfer.id, product_id: item.productId, quantity: item.quantity })));
    if (itemError) {
      form.setError("root", { message: itemError.message });
      return;
    }
    await revalidateInventory();
    router.refresh();
    router.push(`/operations/transfers/${transfer.id}`);
  }

  return (
    <form className="space-y-6" onSubmit={form.handleSubmit(submit)} noValidate>
      {form.formState.errors.root?.message && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {form.formState.errors.root.message}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className="text-xs font-bold text-slate-600">Source Location</span>
          <select className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" {...form.register("sourceLocationId")}>
            <option value="">Select location</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.short_code} · {location.name}
              </option>
            ))}
          </select>
          {form.formState.errors.sourceLocationId?.message && (
            <span className="text-xs text-red-600">{form.formState.errors.sourceLocationId.message}</span>
          )}
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-bold text-slate-600">Destination Location</span>
          <select
            className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
            {...form.register("destinationLocationId")}
          >
            <option value="">Select location</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.short_code} · {location.name}
              </option>
            ))}
          </select>
          {form.formState.errors.destinationLocationId?.message && (
            <span className="text-xs text-red-600">{form.formState.errors.destinationLocationId.message}</span>
          )}
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-bold text-slate-600">Responsible</span>
          <input className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" {...form.register("responsible")} />
          {form.formState.errors.responsible?.message && (
            <span className="text-xs text-red-600">{form.formState.errors.responsible.message}</span>
          )}
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-bold text-slate-600">Schedule Date</span>
          <input type="date" className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" {...form.register("scheduleDate")} />
        </label>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Products</h2>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700"
            onClick={() => items.append({ productId: "", quantity: 1 })}
          >
            <Plus className="size-4" /> Add product
          </button>
        </div>
        {items.fields.map((field, index) => (
          <div key={field.id} className="grid gap-3 sm:grid-cols-[1fr_150px_auto]">
            <select
              className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
              {...form.register(`items.${index}.productId`)}
            >
              <option value="">Select product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} · {product.sku}
                </option>
              ))}
            </select>
            <input
              type="number"
              min="0.001"
              step="0.001"
              className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
              {...form.register(`items.${index}.quantity`)}
            />
            <button
              type="button"
              aria-label="Remove product"
              className="flex size-10 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"
              onClick={() => items.remove(index)}
              disabled={items.fields.length === 1}
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="submit"
        disabled={form.formState.isSubmitting}
        className="h-10 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white disabled:opacity-60"
      >
        Create transfer
      </button>
    </form>
  );
}