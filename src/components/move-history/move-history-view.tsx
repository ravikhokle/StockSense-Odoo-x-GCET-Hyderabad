"use client";

import { CalendarDays, Search } from "lucide-react";
import { useMemo, useState } from "react";

export type MoveHistoryRow = {
  id: string;
  reference: string;
  date: string;
  contact: string;
  product: string;
  from: string;
  to: string;
  quantity: number;
  unit: string;
  type: "receipt" | "delivery" | "transfer" | "adjustment";
  status: string;
  locationIds: string[];
  warehouseIds: string[];
};

export type MoveHistoryLocation = { id: string; name: string; shortCode: string; warehouseId: string };
export type MoveHistoryWarehouse = { id: string; name: string; shortCode: string };

const typeLabels = { receipt: "Receipt", delivery: "Delivery", transfer: "Transfer", adjustment: "Adjustment" };
const typeStyles = { receipt: "bg-emerald-50 text-emerald-700", delivery: "bg-rose-50 text-rose-700", transfer: "bg-slate-100 text-slate-700", adjustment: "bg-slate-100 text-slate-700" };
const statusLabels: Record<string, string> = { draft: "Draft", waiting: "Waiting", ready: "Ready", done: "Done", validated: "Validated", cancelled: "Cancelled" };

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
}

function quantityClass(row: MoveHistoryRow) {
  if (row.type === "transfer") return "text-slate-700";
  return row.quantity >= 0 ? "text-emerald-700" : "text-rose-700";
}

export function MoveHistoryView({ rows, locations, warehouses }: { rows: MoveHistoryRow[]; locations: MoveHistoryLocation[]; warehouses: MoveHistoryWarehouse[] }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [warehouse, setWarehouse] = useState("all");
  const [location, setLocation] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const filteredRows = useMemo(() => rows.filter((row) => {
    const haystack = `${row.reference} ${row.contact} ${row.product} ${row.from} ${row.to}`.toLowerCase();
    const date = row.date.slice(0, 10);
    return haystack.includes(query.toLowerCase()) && (type === "all" || row.type === type) && (status === "all" || row.status === status) && (warehouse === "all" || row.warehouseIds.includes(warehouse)) && (location === "all" || row.locationIds.includes(location)) && (!fromDate || date >= fromDate) && (!toDate || date <= toDate);
  }), [fromDate, location, query, rows, status, toDate, type, warehouse]);

  return <section className="mx-auto max-w-[1500px]"><div><p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">Audit trail</p><h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Move history</h1><p className="mt-2 text-sm text-slate-500">A permanent record of every stock movement.</p></div><div className="mt-8 rounded-2xl border border-slate-200 bg-white p-4"><div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_150px_150px_170px_170px]"><label className="relative lg:col-span-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search reference, product, contact" className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-emerald-500" /></label><select value={type} onChange={(event) => setType(event.target.value)} className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500"><option value="all">All types</option>{Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500"><option value="all">All statuses</option>{[...new Set(rows.map((row) => row.status))].map((value) => <option key={value} value={value}>{statusLabels[value] ?? value}</option>)}</select><select value={warehouse} onChange={(event) => setWarehouse(event.target.value)} className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500"><option value="all">All warehouses</option>{warehouses.map((item) => <option key={item.id} value={item.id}>{item.shortCode} · {item.name}</option>)}</select><select value={location} onChange={(event) => setLocation(event.target.value)} className="h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500"><option value="all">All locations</option>{locations.map((item) => <option key={item.id} value={item.id}>{item.shortCode} · {item.name}</option>)}</select></div><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:w-[340px]"><label className="relative"><CalendarDays className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input type="date" aria-label="From date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-emerald-500" /></label><label className="relative"><CalendarDays className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input type="date" aria-label="To date" value={toDate} onChange={(event) => setToDate(event.target.value)} className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-emerald-500" /></label></div></div><div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="overflow-x-auto"><table className="w-full min-w-[1080px] text-left text-sm"><thead className="border-b border-slate-100 bg-slate-50/70 text-xs font-bold uppercase tracking-wide text-slate-400"><tr><th className="px-5 py-4">Reference</th><th className="px-5 py-4">Date</th><th className="px-5 py-4">Contact</th><th className="px-5 py-4">Product</th><th className="px-5 py-4">From</th><th className="px-5 py-4">To</th><th className="px-5 py-4 text-right">Quantity</th><th className="px-5 py-4">Type</th><th className="px-5 py-4">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{filteredRows.map((row) => <tr key={row.id} className="hover:bg-slate-50"><td className="px-5 py-4 font-mono font-semibold text-slate-800">{row.reference}</td><td className="whitespace-nowrap px-5 py-4 text-slate-600">{formatDate(row.date)}</td><td className="max-w-[180px] truncate px-5 py-4 text-slate-600">{row.contact}</td><td className="px-5 py-4 font-semibold text-slate-800">{row.product}</td><td className="max-w-[180px] truncate px-5 py-4 text-slate-600">{row.from}</td><td className="max-w-[180px] truncate px-5 py-4 text-slate-600">{row.to}</td><td className={`whitespace-nowrap px-5 py-4 text-right font-semibold ${quantityClass(row)}`}>{row.quantity > 0 && row.type !== "transfer" ? "+" : ""}{row.quantity} {row.unit}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${typeStyles[row.type]}`}>{typeLabels[row.type]}</span></td><td className="px-5 py-4 text-slate-600">{statusLabels[row.status] ?? row.status}</td></tr>)}{filteredRows.length === 0 && <tr><td colSpan={9} className="px-5 py-14 text-center text-sm text-slate-500">No movements match these filters.</td></tr>}</tbody></table></div><div className="border-t border-slate-100 px-5 py-3 text-xs font-semibold text-slate-400">{filteredRows.length} of {rows.length} movements</div></div></section>;
}