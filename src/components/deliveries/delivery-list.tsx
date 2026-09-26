"use client";

import Link from "next/link";
import { CalendarDays, ChevronRight, LoaderCircle, Plus, Search } from "lucide-react";
import { useState } from "react";

import type { Delivery } from "@/types/database";

const labels = { draft: "Draft", waiting: "Waiting", ready: "Ready", done: "Done", cancelled: "Cancelled" };
const styles = {
  draft: "bg-slate-100 text-slate-600",
  waiting: "bg-violet-50 text-violet-700",
  ready: "bg-amber-50 text-amber-700",
  done: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-rose-50 text-rose-700",
};

export function DeliveryList({ initialDeliveries = [] }: { initialDeliveries?: Delivery[] }) {
  const [prevDeliveries, setPrevDeliveries] = useState(initialDeliveries);
  const [deliveries, setDeliveries] = useState<Delivery[]>(initialDeliveries);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [date, setDate] = useState("");
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);

  if (initialDeliveries !== prevDeliveries) {
    setPrevDeliveries(initialDeliveries);
    setDeliveries(initialDeliveries);
  }

  const filtered = deliveries.filter(
    (delivery) =>
      `${delivery.reference} ${delivery.delivery_address} ${delivery.responsible}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (status === "all" || delivery.status === status) &&
      (!date || delivery.schedule_date === date)
  );

  return (
    <section className="mx-auto max-w-7xl">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">Operations</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Deliveries</h1>
          <p className="mt-2 text-sm text-slate-500">Track outbound inventory from draft to completion.</p>
        </div>
        <Link
          href="/operations/deliveries/new"
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white"
        >
          <Plus className="size-4" /> New delivery
        </Link>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_190px_190px]">
          <label className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search references or addresses"
              className="h-10 w-full rounded-lg border border-slate-200 pl-9 text-sm outline-none focus:border-emerald-500"
            />
          </label>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500"
          >
            <option value="all">All statuses</option>
            {Object.entries(labels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <label className="relative">
            <CalendarDays className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 pl-9 text-sm outline-none focus:border-emerald-500"
            />
          </label>
        </div>
      </div>

      {error && <p className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-225 text-left">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                {["Reference", "From", "To", "Contact", "Schedule Date", "Status", ""].map((heading) => (
                  <th key={heading} className="px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <LoaderCircle className="mx-auto animate-spin text-emerald-600" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-sm text-slate-400">
                    No deliveries found.
                  </td>
                </tr>
              ) : (
                filtered.map((delivery) => (
                  <tr key={delivery.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <Link
                        href={`/operations/deliveries/${delivery.id}`}
                        className="font-mono text-sm font-semibold text-emerald-700"
                      >
                        {delivery.reference}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-700">
                      {delivery.source_location?.short_code ?? "—"}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">{delivery.delivery_address}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{delivery.responsible}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{delivery.schedule_date}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles[delivery.status]}`}>
                        {labels[delivery.status]}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <ChevronRight className="ml-auto size-4 text-slate-400" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
