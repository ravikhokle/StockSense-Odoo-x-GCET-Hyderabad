"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, Edit3, LoaderCircle, PackagePlus, Search, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ProductForm } from "@/components/products/product-form";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { revalidateInventory } from "@/lib/actions/revalidate";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { formatProductDatabaseError } from "@/lib/products/errors";
import type { Location, Product, ProductWithStock } from "@/types/database";

const PAGE_SIZE = 8;

type ProductRow = ProductWithStock;

function getStock(product: ProductRow) {
  return (product.stock_levels ?? []).reduce((sum, level) => sum + Number(level.quantity), 0);
}

function getAvailable(product: ProductRow) {
  return (product.stock_levels ?? []).reduce(
    (sum, level) => sum + Number(level.quantity) - Number(level.reserved_quantity),
    0
  );
}

function stockStatus(product: ProductRow) {
  const stock = getStock(product);
  if (stock <= 0) return { label: "Out of stock", className: "bg-rose-50 text-rose-700" };
  if (stock <= Number(product.reorder_level))
    return { label: "Low stock", className: "bg-amber-50 text-amber-700" };
  return { label: "In stock", className: "bg-emerald-50 text-emerald-700" };
}

export function ProductList({
  initialProducts = [],
  initialCategories = [],
  initialLocations = [],
}: {
  initialProducts?: ProductWithStock[];
  initialCategories?: string[];
  initialLocations?: Location[];
}) {
  const router = useRouter();
  const [prevProducts, setPrevProducts] = useState(initialProducts);
  const [products, setProducts] = useState<ProductRow[]>(initialProducts);
  const [categoryNames, setCategoryNames] = useState<string[]>(initialCategories);
  const [locations, setLocations] = useState<Location[]>(initialLocations);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();
  const [showForm, setShowForm] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<ProductRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Sync state when props change from server revalidation
  if (initialProducts !== prevProducts) {
    setPrevProducts(initialProducts);
    setProducts(initialProducts);
    setCategoryNames(initialCategories);
    setLocations(initialLocations);
  }

  async function loadProducts() {
    if (!hasSupabaseConfig()) {
      setError("Supabase is not configured. Add the required environment variables to load products.");
      setLoading(false);
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const [
      { data, error: productError },
      { data: categories, error: categoryError },
      { data: locationData, error: locationError },
    ] = await Promise.all([
      supabase.from("products").select("*, category:categories(*), stock_levels(*)").order("name"),
      supabase.from("categories").select("name").order("name"),
      supabase.from("locations").select("*").order("name"),
    ]);
    if (productError || categoryError || locationError) {
      setError(
        formatProductDatabaseError(
          productError?.message ?? categoryError?.message ?? locationError?.message ?? "Could not load products."
        )
      );
      setLoading(false);
      return;
    }
    setProducts((data ?? []) as ProductRow[]);
    setCategoryNames((categories ?? []).map((category) => category.name));
    setLocations((locationData ?? []) as Location[]);
    setError(null);
    setLoading(false);
  }

  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        const matchesQuery = `${product.name} ${product.sku}`.toLowerCase().includes(query.toLowerCase());
        const matchesCategory = categoryFilter === "all" || product.category?.name === categoryFilter;
        const matchesStatus = statusFilter === "all" || stockStatus(product).label === statusFilter;
        return matchesQuery && matchesCategory && matchesStatus;
      }),
    [products, query, categoryFilter, statusFilter]
  );

  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const visibleProducts = filteredProducts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function updateQuery(value: string) {
    setQuery(value);
    setPage(1);
  }
  function updateFilter(setter: (value: string) => void, value: string) {
    setter(value);
    setPage(1);
  }

  async function handleProductSaved() {
    setShowForm(false);
    await revalidateInventory();
    toast.success("Product deleted.");
    router.refresh();
    void loadProducts();
  }

  async function handleDeleteProduct() {
    if (!deletingProduct) return;
    setIsDeleting(true);
    setDeleteError(null);
    const supabase = createClient();
    const { error: err } = await supabase.from("products").delete().eq("id", deletingProduct.id);
    if (err) {
      if (err.code === "23503") {
        setDeleteError("Cannot delete this product because it has associated transaction records or movements.");
      } else {
        setDeleteError(formatProductDatabaseError(err.message));
      }
      setIsDeleting(false);
      return;
    }
    setDeletingProduct(null);
    setIsDeleting(false);
    await revalidateInventory();
    router.refresh();
    void loadProducts();
  }

  return (
    <section className="mx-auto max-w-7xl">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">Catalog</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Products</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Manage product information and current stock visibility.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingProduct(undefined);
            setShowForm(true);
          }}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
        >
          <PackagePlus className="size-4" /> Add product
        </button>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.35)]">
        <div className="grid gap-3 md:grid-cols-[1fr_190px_180px]">
          <label className="relative block">
            <span className="sr-only">Search products</span>
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => updateQuery(event.target.value)}
              placeholder="Search by product or SKU"
              className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-3 focus:ring-emerald-100"
            />
          </label>
          <select
            value={categoryFilter}
            onChange={(event) => updateFilter(setCategoryFilter, event.target.value)}
            className="h-10 rounded-lg border border-slate-200 px-3 text-sm text-slate-600 outline-none focus:border-emerald-500"
          >
            <option value="all">All categories</option>
            {categoryNames.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(event) => updateFilter(setStatusFilter, event.target.value)}
            className="h-10 rounded-lg border border-slate-200 px-3 text-sm text-slate-600 outline-none focus:border-emerald-500"
          >
            <option value="all">All stock statuses</option>
            <option value="In stock">In stock</option>
            <option value="Low stock">Low stock</option>
            <option value="Out of stock">Out of stock</option>
          </select>
        </div>
      </div>

      {error && (
        <div role="alert" className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_-24px_rgba(15,23,42,0.35)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-225 text-left">
            <thead className="border-b border-slate-100 bg-slate-50/80">
              <tr>
                {["Product", "SKU", "Category", "Unit", "On Hand", "Available", "Reorder Level", "Status", "Actions"].map(
                  (heading) => (
                    <th key={heading} className="px-5 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
                      {heading}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <LoaderCircle className="mx-auto size-5 animate-spin text-emerald-600" />
                  </td>
                </tr>
              ) : visibleProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-16 text-center">
                    <PackagePlus className="mx-auto size-8 text-slate-300" />
                    <p className="mt-3 text-sm font-semibold text-slate-600">
                      {products.length === 0 ? "No products yet" : "No matching products"}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {products.length === 0
                        ? "Create your first product to start building the catalog."
                        : "Try changing your search or filters."}
                    </p>
                  </td>
                </tr>
              ) : (
                visibleProducts.map((product) => {
                  const status = stockStatus(product);
                  return (
                    <tr key={product.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-4">
                        <Link href={`/products/${product.id}`} className="font-semibold text-slate-900 hover:text-emerald-700">
                          {product.name}
                        </Link>
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-500">{product.sku}</td>
                      <td className="px-5 py-4 text-sm text-slate-600">{product.category?.name ?? "—"}</td>
                      <td className="px-5 py-4 text-sm text-slate-600">{product.unit}</td>
                      <td className="px-5 py-4 text-sm font-semibold text-slate-800">{getStock(product)}</td>
                      <td className="px-5 py-4 text-sm text-slate-600">{getAvailable(product)}</td>
                      <td className="px-5 py-4 text-sm text-slate-600">{product.reorder_level}</td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            aria-label={`Edit ${product.name}`}
                            title={`Edit ${product.name}`}
                            onClick={() => {
                              setEditingProduct(product);
                              setShowForm(true);
                            }}
                            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                          >
                            <Edit3 className="size-4" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Delete ${product.name}`}
                            title={`Delete ${product.name}`}
                            onClick={() => {
                              setDeleteError(null);
                              setDeletingProduct(product);
                            }}
                            className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
          <p className="text-xs text-slate-400">
            {filteredProducts.length} product{filteredProducts.length === 1 ? "" : "s"}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous page"
              disabled={page === 1}
              onClick={() => setPage((current) => current - 1)}
              className="rounded-lg border border-slate-200 p-2 text-slate-500 disabled:opacity-40"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="text-xs font-semibold text-slate-500">
              Page {page} of {pageCount}
            </span>
            <button
              type="button"
              aria-label="Next page"
              disabled={page >= pageCount}
              onClick={() => setPage((current) => current + 1)}
              className="rounded-lg border border-slate-200 p-2 text-slate-500 disabled:opacity-40"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {showForm && (
        <ProductForm
          product={editingProduct}
          categories={categoryNames}
          locations={locations}
          onClose={() => setShowForm(false)}
          onSaved={() => void handleProductSaved()}
        />
      )}

      <DeleteConfirmDialog
        isOpen={Boolean(deletingProduct)}
        title={deletingProduct ? `Delete "${deletingProduct.name}"?` : "Delete product?"}
        description="Are you sure you want to permanently delete this product? All corresponding stock levels for this product will also be deleted."
        confirmLabel="Delete product"
        isDeleting={isDeleting}
        error={deleteError}
        onConfirm={() => void handleDeleteProduct()}
        onCancel={() => {
          if (!isDeleting) {
            setDeletingProduct(null);
            setDeleteError(null);
          }
        }}
      />
    </section>
  );
}
