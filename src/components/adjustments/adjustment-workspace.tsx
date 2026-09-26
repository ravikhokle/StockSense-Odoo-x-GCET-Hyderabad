"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { revalidateInventory } from "@/lib/actions/revalidate";
import { adjustmentSchema, type AdjustmentFormValues } from "@/lib/adjustments/schemas";
import { createClient } from "@/lib/supabase/client";
import type { Location, Product, StockLevel } from "@/types/database";

export function AdjustmentWorkspace({
  products,
  locations,
  stockLevels,
}: {
  products: Product[];
  locations: Location[];
  stockLevels: StockLevel[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<z.input<typeof adjustmentSchema>, unknown, AdjustmentFormValues>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: { productId: "", locationId: "", countedQuantity: 0, reason: "" },
  });
  const productId = useWatch({ control: form.control, name: "productId" });
  const locationId = useWatch({ control: form.control, name: "locationId" });
  const currentQuantity = Number(
    stockLevels.find((stock) => stock.product_id === productId && stock.location_id === locationId)?.quantity ?? 0
  );
  const countedQuantity = Number(useWatch({ control: form.control, name: "countedQuantity" }) ?? 0);

  async function submit(values: AdjustmentFormValues) {
    setError(null);
    const supabase = createClient();
    const { data: adjustment, error: adjustmentError } = await supabase
      .from("adjustments")
      .insert({ location_id: values.locationId, reason: values.reason, status: "draft" })
      .select("id")
      .single();
    if (adjustmentError || !adjustment) {
      setError(adjustmentError?.message ?? "Could not create adjustment.");
      return;
    }
    const { error: itemError } = await supabase.from("adjustment_items").insert({
      adjustment_id: adjustment.id,
      product_id: values.productId,
      current_quantity: currentQuantity,
      counted_quantity: values.countedQuantity,
    });
    if (itemError) {
      setError(itemError.message);
      return;
    }
    const { error: validationError } = await supabase.rpc("validate_adjustment", {
      p_adjustment_id: adjustment.id,
    });
    if (validationError) {
      setError(validationError.message);
      return;
    }
    await revalidateInventory();
    router.refresh();
    form.reset({ productId: "", locationId: "", countedQuantity: 0, reason: "" });
  }

  return (
    <form className="space-y-6" onSubmit={form.handleSubmit(submit)} noValidate>
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className="text-xs font-bold text-slate-600">Product</span>
          <select className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" {...form.register("productId")}>
            <option value="">Select product</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} · {product.sku}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-bold text-slate-600">Location</span>
          <select className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" {...form.register("locationId")}>
            <option value="">Select location</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.short_code} · {location.name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-bold text-slate-600">Current Quantity</span>
          <input
            readOnly
            value={currentQuantity}
            className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500"
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-bold text-slate-600">Counted Quantity</span>
          <input
            type="number"
            min="0"
            step="0.001"
            className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
            {...form.register("countedQuantity")}
          />
          <span
            className={`text-xs font-semibold ${
              countedQuantity - currentQuantity < 0 ? "text-rose-600" : "text-emerald-700"
            }`}
          >
            Difference: {countedQuantity - currentQuantity}
          </span>
        </label>
        <label className="space-y-1.5 sm:col-span-2">
          <span className="text-xs font-bold text-slate-600">Reason</span>
          <textarea
            rows={3}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Explain the stock count difference"
            {...form.register("reason")}
          />
        </label>
      </div>
      <button
        type="submit"
        disabled={form.formState.isSubmitting}
        className="h-10 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white disabled:opacity-60"
      >
        Validate adjustment
      </button>
    </form>
  );
}