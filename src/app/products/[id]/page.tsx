import Link from "next/link";
import { ArrowLeft, MapPin, Package, Pencil } from "lucide-react";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: product, error } = await supabase.from("products").select("*, category:categories(*), stock_levels(*)").eq("id", id).single();

  if (error || !product) notFound();
  const stockLevels = (product.stock_levels ?? []) as Array<{ id: string; location_name: string; quantity: number; reserved_quantity: number }>;
  const onHand = stockLevels.reduce((sum, level) => sum + Number(level.quantity), 0);
  const available = stockLevels.reduce((sum, level) => sum + Number(level.quantity) - Number(level.reserved_quantity), 0);
  const categoryName = product.category?.name ?? "Uncategorized";

  return (
    <section className="mx-auto max-w-6xl">
      <Link href="/products" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-emerald-700"><ArrowLeft className="size-4" /> Back to products</Link>
      <div className="mt-6 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">Product detail</p><h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{product.name}</h1><p className="mt-2 font-mono text-sm text-slate-500">{product.sku}</p></div><button type="button" disabled className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-400"><Pencil className="size-4" /> Edit from products</button></div>
      <div className="mt-8 grid gap-5 md:grid-cols-3"><div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">On hand</p><p className="mt-4 text-3xl font-bold text-slate-950">{onHand}</p><p className="mt-1 text-xs text-slate-400">Across all locations</p></div><div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Available</p><p className="mt-4 text-3xl font-bold text-emerald-600">{available}</p><p className="mt-1 text-xs text-slate-400">After reservations</p></div><div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Reorder level</p><p className="mt-4 text-3xl font-bold text-slate-950">{product.reorder_level}</p><p className="mt-1 text-xs text-slate-400">Restock threshold</p></div></div>
      <div className="mt-5 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]"><div className="rounded-2xl border border-slate-200 bg-white p-6"><div className="flex size-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"><Package className="size-5" /></div><h2 className="mt-5 text-base font-bold text-slate-900">Product information</h2><dl className="mt-5 space-y-4 text-sm"><div className="flex justify-between gap-4"><dt className="text-slate-400">SKU</dt><dd className="font-mono text-slate-700">{product.sku}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-400">Category</dt><dd className="text-slate-700">{categoryName}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-400">Unit</dt><dd className="text-slate-700">{product.unit}</dd></div></dl></div><div className="rounded-2xl border border-slate-200 bg-white p-6"><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600"><MapPin className="size-5" /></span><div><h2 className="text-base font-bold text-slate-900">Stock by location</h2><p className="mt-1 text-xs text-slate-500">Current stock balances by storage location.</p></div></div><div className="mt-5 overflow-hidden rounded-xl border border-slate-100"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-400"><tr><th className="px-4 py-3 font-semibold">Location</th><th className="px-4 py-3 text-right font-semibold">On hand</th><th className="px-4 py-3 text-right font-semibold">Available</th></tr></thead><tbody className="divide-y divide-slate-100">{stockLevels.length === 0 ? <tr><td colSpan={3} className="px-4 py-8 text-center text-xs text-slate-400">No stock locations yet.</td></tr> : stockLevels.map((level) => <tr key={level.id}><td className="px-4 py-3 font-medium text-slate-700">{level.location_name}</td><td className="px-4 py-3 text-right text-slate-600">{level.quantity}</td><td className="px-4 py-3 text-right text-slate-600">{Number(level.quantity) - Number(level.reserved_quantity)}</td></tr>)}</tbody></table></div></div></div>
    </section>
  );
}
