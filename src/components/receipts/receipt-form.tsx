"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { revalidateInventory } from "@/lib/actions/revalidate";
import { createClient } from "@/lib/supabase/client";
import { receiptSchema, type ReceiptFormValues } from "@/lib/receipts/schemas";
import type { Location, Product } from "@/types/database";

export function ReceiptForm({ products, locations }: { products: Product[]; locations: Location[] }) {
  const router = useRouter();
  const supabase = createClient();
  const form = useForm<z.input<typeof receiptSchema>, unknown, ReceiptFormValues>({
    resolver: zodResolver(receiptSchema),
    defaultValues: {
      vendorName: "",
      destinationLocationId: "",
      scheduleDate: new Date().toISOString().slice(0, 10),
      responsible: "",
      items: [{ productId: "", quantity: 1 }],
    },
  });
  const items = useFieldArray({ control: form.control, name: "items" });

  async function submit(values: ReceiptFormValues) {
    const { data: receipt, error: receiptError } = await supabase
      .from("receipts")
      .insert({
        reference: "",
        vendor_name: values.vendorName,
        destination_location_id: values.destinationLocationId,
        schedule_date: values.scheduleDate,
        responsible: values.responsible,
        status: "draft",
      })
      .select("id")
      .single();
    if (receiptError || !receipt) {
      form.setError("root", { message: receiptError?.message ?? "Could not create receipt." });
      return;
    }
    const { error: itemError } = await supabase
      .from("receipt_items")
      .insert(values.items.map((item) => ({ receipt_id: receipt.id, product_id: item.productId, quantity: item.quantity })));
    if (itemError) {
      form.setError("root", { message: itemError.message });
      return;
    }
    await revalidateInventory();
    router.refresh();
    toast.success("Receipt created.");
    router.push(`/operations/receipts/${receipt.id}`);
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
          <span className="text-xs font-bold text-slate-600">Vendor / Receive From</span>
          <input
            className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500"
            placeholder="Vendor name"
            {...form.register("vendorName")}
          />
          {form.formState.errors.vendorName?.message && (
            <span className="text-xs text-red-600">{form.formState.errors.vendorName.message}</span>
          )}
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-bold text-slate-600">Responsible</span>
          <input
            className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500"
            placeholder="Person responsible"
            {...form.register("responsible")}
          />
          {form.formState.errors.responsible?.message && (
            <span className="text-xs text-red-600">{form.formState.errors.responsible.message}</span>
          )}
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-bold text-slate-600">Destination Location</span>
          <select
            className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500"
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
          <span className="text-xs font-bold text-slate-600">Schedule Date</span>
          <input
            type="date"
            className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500"
            {...form.register("scheduleDate")}
          />
          {form.formState.errors.scheduleDate?.message && (
            <span className="text-xs text-red-600">{form.formState.errors.scheduleDate.message}</span>
          )}
        </label>
      </div>
      <div className="rounded-xl border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Products</h2>
            <p className="text-xs text-slate-500">Add one or more products to receive.</p>
          </div>
          <button
            type="button"
            onClick={() => items.append({ productId: "", quantity: 1 })}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700"
          >
            <Plus className="size-4" /> Add line
          </button>
        </div>
        <div className="space-y-3 p-4">
          {items.fields.map((field, index) => (
            <div key={field.id} className="grid gap-3 sm:grid-cols-[1fr_150px_40px]">
              <label className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Product</span>
                <select
                  className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500"
                  {...form.register(`items.${index}.productId`)}
                >
                  <option value="">Select product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} · {product.sku}
                    </option>
                  ))}
                </select>
                {form.formState.errors.items?.[index]?.productId?.message && (
                  <span className="text-xs text-red-600">
                    {form.formState.errors.items[index]?.productId?.message}
                  </span>
                )}
              </label>
              <label className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Quantity</span>
                <input
                  type="number"
                  min="0.001"
                  step="0.001"
                  className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500"
                  {...form.register(`items.${index}.quantity`, { valueAsNumber: true })}
                />
                {form.formState.errors.items?.[index]?.quantity?.message && (
                  <span className="text-xs text-red-600">
                    {form.formState.errors.items[index]?.quantity?.message}
                  </span>
                )}
              </label>
              <button
                type="button"
                aria-label="Remove product line"
                disabled={items.fields.length === 1}
                onClick={() => items.remove(index)}
                className="mt-6 rounded-lg p-2 text-slate-400 hover:bg-slate-100 disabled:opacity-30"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
      <button
        type="submit"
        disabled={form.formState.isSubmitting}
        className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-5 text-sm font-semibold text-white disabled:opacity-50"
      >
        {form.formState.isSubmitting && <LoaderCircle className="size-4 animate-spin" />}Create draft
      </button>
    </form>
  );
}
