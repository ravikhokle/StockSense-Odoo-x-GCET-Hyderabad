"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { createClient } from "@/lib/supabase/client";
import { productSchema, type ProductFormInput, type ProductFormValues } from "@/lib/products/schemas";
import type { Product } from "@/types/database";

function Field({ label, error, ...props }: { label: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-bold text-slate-600">{label}</span>
      <input className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-3 focus:ring-emerald-100" {...props} />
      {error && <span className="block text-xs font-medium text-red-600">{error}</span>}
    </label>
  );
}

export function ProductForm({ product, categories, onClose, onSaved }: { product?: Product; categories: string[]; onClose: () => void; onSaved: () => void }) {
  const isEditing = Boolean(product);
  const [formError, setFormError] = useState<string | null>(null);
  const supabase = createClient();
  const form = useForm<ProductFormInput, unknown, ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name ?? "",
      sku: product?.sku ?? "",
      category: product?.category?.name ?? "",
      unit: product?.unit ?? "",
      initialStock: 0,
      reorderLevel: product?.reorder_level ?? 0,
    },
  });

  useEffect(() => {
    form.reset({
      name: product?.name ?? "",
      sku: product?.sku ?? "",
      category: product?.category?.name ?? "",
      unit: product?.unit ?? "",
      initialStock: 0,
      reorderLevel: product?.reorder_level ?? 0,
    });
  }, [form, product]);

  async function onSubmit(values: ProductFormValues) {
    setFormError(null);
    let categoryId: string;
    const { data: existingCategory, error: categoryLookupError } = await supabase.from("categories").select("id").ilike("name", values.category).maybeSingle();
    if (categoryLookupError) {
      setFormError(categoryLookupError.message);
      return;
    }
    if (existingCategory) {
      categoryId = existingCategory.id;
    } else {
      const { data: createdCategory, error: categoryError } = await supabase.from("categories").insert({ name: values.category }).select("id").single();
      if (categoryError || !createdCategory) {
        setFormError(categoryError?.code === "23505" ? "That category already exists. Try again." : categoryError?.message ?? "Could not create category.");
        return;
      }
      categoryId = createdCategory.id;
    }

    if (isEditing && product) {
      const { error } = await supabase.from("products").update({ name: values.name, sku: values.sku, category_id: categoryId, unit: values.unit, reorder_level: values.reorderLevel }).eq("id", product.id);
      if (error) {
        setFormError(error.code === "23505" ? "That SKU is already in use." : error.message);
        return;
      }
    } else {
      const { data: createdProduct, error } = await supabase.from("products").insert({ name: values.name, sku: values.sku, category_id: categoryId, unit: values.unit, reorder_level: values.reorderLevel }).select("id").single();
      if (error || !createdProduct) {
        setFormError(error?.code === "23505" ? "That SKU is already in use." : error?.message ?? "Could not create product.");
        return;
      }
      const { error: stockError } = await supabase.from("stock_levels").insert({ product_id: createdProduct.id, location_name: "Default location", quantity: values.initialStock, reserved_quantity: 0 });
      if (stockError) {
        setFormError(stockError.message);
        return;
      }
    }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" role="dialog" aria-modal="true" aria-labelledby="product-form-title">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">Catalog</p><h2 id="product-form-title" className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{isEditing ? "Edit product" : "Create product"}</h2><p className="mt-1 text-sm text-slate-500">{isEditing ? "Update catalog information without changing stock history." : "Add a product and its opening stock balance."}</p></div>
          <button type="button" aria-label="Close" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" onClick={onClose}><X className="size-5" /></button>
        </div>
        <form className="mt-7 space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          {formError && <p role="alert" className="rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">{formError}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" placeholder="e.g. Packing tape" {...form.register("name")} error={form.formState.errors.name?.message} />
            <Field label="SKU / Code" placeholder="e.g. TAPE-001" {...form.register("sku")} error={form.formState.errors.sku?.message} />
            <div className="space-y-1.5"><label htmlFor="category" className="text-xs font-bold text-slate-600">Category</label><input id="category" list="product-categories" placeholder="e.g. Packaging" className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-3 focus:ring-emerald-100" {...form.register("category")} /><datalist id="product-categories">{categories.map((category) => <option key={category} value={category} />)}</datalist>{form.formState.errors.category?.message && <span className="block text-xs font-medium text-red-600">{form.formState.errors.category.message}</span>}</div>
            <Field label="Unit of Measure" placeholder="e.g. Each" {...form.register("unit")} error={form.formState.errors.unit?.message} />
            <Field label="Initial Stock" type="number" min="0" step="0.001" disabled={isEditing} {...form.register("initialStock", { valueAsNumber: true })} error={form.formState.errors.initialStock?.message} />
            <Field label="Reorder Level" type="number" min="0" step="0.001" {...form.register("reorderLevel", { valueAsNumber: true })} error={form.formState.errors.reorderLevel?.message} />
          </div>
          {isEditing && <p className="text-xs text-slate-400">Initial stock is locked during edits so historical stock records remain unchanged.</p>}
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5"><button type="button" className="h-10 rounded-lg px-4 text-sm font-semibold text-slate-600 hover:bg-slate-100" onClick={onClose}>Cancel</button><button type="submit" disabled={form.formState.isSubmitting} className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">{form.formState.isSubmitting && <LoaderCircle className="size-4 animate-spin" />}{form.formState.isSubmitting ? "Saving..." : isEditing ? "Save changes" : "Create product"}</button></div>
        </form>
      </div>
    </div>
  );
}
