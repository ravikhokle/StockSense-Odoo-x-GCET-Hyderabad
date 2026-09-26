"use client";

import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import type { Transfer } from "@/types/database";

const labels = { draft: "Draft", ready: "Ready", done: "Done", cancelled: "Cancelled" };
const styles = { draft: "bg-slate-100 text-slate-600", ready: "bg-amber-50 text-amber-700", done: "bg-emerald-50 text-emerald-700", cancelled: "bg-rose-50 text-rose-700" };

export function TransferList() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { void createClient().from("transfers").select("*, source_location:locations!transfers_source_location_id_fkey(*), destination_location:locations!transfers_destination_location_id_fkey(*)").order("schedule_date", { ascending: false }).then(({ data, error: loadError }) => { if (loadError) setError(loadError.message); else setTransfers((data ?? []) as Transfer[]); }); }, []);
  return <section className="mx-auto max-w-7xl"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">Operations</p><h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Internal transfers</h1><p className="mt-2 text-sm text-slate-500">Move stock between locations without changing total inventory.</p></div><Link href="/operations/transfers/new" className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white"><Plus className="size-4" /> New transfer</Link></div>{error && <p className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}<div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="border-b border-slate-100 bg-slate-50/70 text-xs font-bold uppercase tracking-wide text-slate-400"><tr><th className="px-5 py-4">Reference</th><th className="px-5 py-4">Route</th><th className="px-5 py-4">Responsible</th><th className="px-5 py-4">Schedule</th><th className="px-5 py-4">Status</th><th /></tr></thead><tbody className="divide-y divide-slate-100">{transfers.map((transfer) => <tr key={transfer.id} className="hover:bg-slate-50"><td className="px-5 py-4 font-mono font-semibold text-slate-800">{transfer.reference}</td><td className="px-5 py-4 text-slate-600">{transfer.source_location?.short_code} → {transfer.destination_location?.short_code}</td><td className="px-5 py-4 text-slate-600">{transfer.responsible}</td><td className="px-5 py-4 text-slate-600">{transfer.schedule_date}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${styles[transfer.status]}`}>{labels[transfer.status]}</span></td><td className="px-5 py-4 text-right"><Link href={`/operations/transfers/${transfer.id}`} aria-label={`Open ${transfer.reference}`} className="inline-flex text-slate-400 hover:text-emerald-700"><ChevronRight className="size-5" /></Link></td></tr>)}{transfers.length === 0 && <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-500">No transfers yet.</td></tr>}</tbody></table></div></div></section>;
}