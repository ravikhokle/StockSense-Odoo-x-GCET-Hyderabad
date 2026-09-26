import {
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpFromLine,
  ClipboardList,
  Filter,
  Package,
  RefreshCw,
  TriangleAlert,
  Warehouse,
} from "lucide-react";

const kpis = [
  { label: "Total Products", value: "0", hint: "No products yet", icon: Package, tone: "bg-sky-50 text-sky-600" },
  { label: "Low Stock", value: "0", hint: "Nothing to review", icon: TriangleAlert, tone: "bg-amber-50 text-amber-600" },
  { label: "Out of Stock", value: "0", hint: "No stock records", icon: Package, tone: "bg-rose-50 text-rose-600" },
  { label: "Pending Receipts", value: "0", hint: "No receipts yet", icon: ArrowDownToLine, tone: "bg-emerald-50 text-emerald-600" },
  { label: "Pending Deliveries", value: "0", hint: "No deliveries yet", icon: ArrowUpFromLine, tone: "bg-violet-50 text-violet-600" },
  { label: "Internal Transfers", value: "0", hint: "No transfers yet", icon: ArrowLeftRight, tone: "bg-orange-50 text-orange-600" },
];

const filters = [
  { label: "Document Type", options: ["All document types", "Receipts", "Deliveries", "Transfers"] },
  { label: "Status", options: ["All statuses", "Draft", "Pending", "Completed"] },
  { label: "Warehouse", options: ["All warehouses"] },
  { label: "Location", options: ["All locations"] },
  { label: "Category", options: ["All categories"] },
];

const sections = [
  { title: "Recent Receipts", description: "Inbound documents will appear here.", icon: ArrowDownToLine },
  { title: "Recent Deliveries", description: "Outbound documents will appear here.", icon: ArrowUpFromLine },
  { title: "Recent Transfers", description: "Internal movements will appear here.", icon: ArrowLeftRight },
  { title: "Low Stock Products", description: "Products needing attention will appear here.", icon: TriangleAlert },
];

function EmptySection({ title, description, icon: Icon }: (typeof sections)[number]) {
  return (
    <section className="min-h-56 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.35)] sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
        </div>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
          <Icon className="size-4.5" strokeWidth={1.8} />
        </span>
      </div>
      <div className="flex min-h-32 flex-col items-center justify-center text-center">
        <ClipboardList className="size-7 text-slate-300" strokeWidth={1.5} />
        <p className="mt-3 text-sm font-semibold text-slate-600">No records yet</p>
        <p className="mt-1 text-xs text-slate-400">This section will update when data is available.</p>
      </div>
    </section>
  );
}

export function DashboardView() {
  return (
    <section className="mx-auto max-w-7xl">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">Overview</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Dashboard</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">A focused view of inventory health and movement across your network.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
          <RefreshCw className="size-3.5" /> Awaiting inventory data
        </div>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {kpis.map(({ label, value, hint, icon: Icon, tone }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.35)]">
            <div className="flex items-start justify-between gap-4">
              <p className="text-sm font-semibold text-slate-600">{label}</p>
              <span className={`flex size-9 items-center justify-center rounded-lg ${tone}`}><Icon className="size-4.5" strokeWidth={1.8} /></span>
            </div>
            <p className="mt-5 text-3xl font-bold tracking-tight text-slate-950">{value}</p>
            <p className="mt-1 text-xs font-medium text-slate-400">{hint}</p>
          </div>
        ))}
      </div>

      <form className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.35)] sm:p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600"><Filter className="size-4.5" strokeWidth={1.8} /></span>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Filter workspace</h2>
              <p className="mt-0.5 text-xs text-slate-500">Refine dashboard records when inventory data is available.</p>
            </div>
          </div>
          <button type="reset" className="text-left text-xs font-semibold text-emerald-700 hover:text-emerald-800">Reset filters</button>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {filters.map(({ label, options }) => (
            <label key={label} className="space-y-2">
              <span className="block text-xs font-semibold text-slate-500">{label}</span>
              <select defaultValue={options[0]} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none focus:border-emerald-500 focus:ring-3 focus:ring-emerald-100">
                {options.map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
          ))}
        </div>
      </form>

      <div className="mt-8 grid gap-5 xl:grid-cols-2">
        {sections.map((section) => <EmptySection key={section.title} {...section} />)}
      </div>

      <div className="mt-5 flex items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-xs text-slate-500">
        <Warehouse className="size-4 shrink-0 text-slate-400" />
        Inventory metrics will appear here after products, warehouses, and operations are configured.
      </div>
    </section>
  );
}
