import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { TransferForm } from "@/components/transfers/transfer-form";
import { createClient } from "@/lib/supabase/server";
import type { Location, Product } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function NewTransferPage() {
  const supabase = await createClient();
  const [{ data: products }, { data: locations }] = await Promise.all([
    supabase.from("products").select("*").order("name"),
    supabase.from("locations").select("*").order("name"),
  ]);
  return (
    <section className="mx-auto max-w-5xl">
      <Link
        href="/operations/transfers"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-emerald-700"
      >
        <ArrowLeft className="size-4" /> Back to transfers
      </Link>
      <div className="mt-6">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">Operations</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">New internal transfer</h1>
        <p className="mt-2 text-sm text-slate-500">Prepare a stock movement between two locations.</p>
      </div>
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <TransferForm products={(products ?? []) as Product[]} locations={(locations ?? []) as Location[]} />
      </div>
    </section>
  );
}