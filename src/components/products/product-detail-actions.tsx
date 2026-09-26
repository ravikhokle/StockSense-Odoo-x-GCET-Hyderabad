"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Edit3, Trash2 } from "lucide-react";
import { ProductForm } from "@/components/products/product-form";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { createClient } from "@/lib/supabase/client";
import { revalidateInventory } from "@/lib/actions/revalidate";
import type { Location, Product } from "@/types/database";

export function ProductDetailActions({
  product,
  categories,
  locations,
}: {
  product: Product;
  categories: string[];
  locations: Location[];
}) {
  const router = useRouter();
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleDelete() {
    setIsDeleting(true);
    setDeleteError(null);
    const supabase = createClient();
    const { error } = await supabase.from("products").delete().eq("id", product.id);
    if (error) {
      if (error.code === "23503") {
        setDeleteError("Cannot delete this product because it has associated transaction records or movements.");
      } else {
        setDeleteError(error.message);
      }
      setIsDeleting(false);
      return;
    }

    await revalidateInventory();
    router.push("/products");
    router.refresh();
  }

  async function handleSaved() {
    setShowEdit(false);
    await revalidateInventory();
    router.refresh();
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowEdit(true)}
          className="inline-flex h-9.5 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900 transition-colors"
        >
          <Edit3 className="size-4 text-slate-500" /> Edit product
        </button>
        <button
          type="button"
          onClick={() => {
            setDeleteError(null);
            setShowDelete(true);
          }}
          className="inline-flex h-9.5 items-center gap-2 rounded-lg border border-rose-200 bg-rose-50/50 px-3.5 text-sm font-semibold text-rose-700 shadow-sm hover:bg-rose-100 hover:text-rose-800 transition-colors"
        >
          <Trash2 className="size-4 text-rose-500" /> Delete product
        </button>
      </div>

      {showEdit && (
        <ProductForm
          product={product}
          categories={categories}
          locations={locations}
          onClose={() => setShowEdit(false)}
          onSaved={() => void handleSaved()}
        />
      )}

      <DeleteConfirmDialog
        isOpen={showDelete}
        title={`Delete "${product.name}"?`}
        description="Are you sure you want to permanently delete this product? All corresponding stock levels for this product will also be removed."
        confirmLabel="Delete product"
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
