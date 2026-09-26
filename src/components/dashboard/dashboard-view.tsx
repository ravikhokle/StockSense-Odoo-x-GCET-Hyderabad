"use client";

import { useMemo, useState } from "react";
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

export type DashboardProduct = {
  id: string;
  name: string;
  sku: string;
  category_id: string | null;
  reorder_level: number;
};

export type DashboardStockLevel = {
  id: string;
  product_id: string;
  location_id: string | null;
  location_name: string;
  quantity: number;
  reserved_quantity: number;
};

export type DashboardReceipt = {
  id: string;
  reference: string;
  status: string;
  destination_location_id: string;
  vendor_name: string;
};

export type DashboardDelivery = {
  id: string;
  reference: string;
  status: string;
  source_location_id: string;
  delivery_address: string;
};

export type DashboardTransfer = {
  id: string;
  reference: string;
  status: string;
  source_location_id: string;
  destination_location_id: string;
};

export type DashboardCategory = {
  id: string;
  name: string;
};

export type DashboardWarehouse = {
  id: string;
  name: string;
  short_code: string;
};

export type DashboardLocation = {
  id: string;
  name: string;
  short_code: string;
  warehouse_id: string;
};

export type DashboardViewProps = {
  products: DashboardProduct[];
  stockLevels: DashboardStockLevel[];
  receipts: DashboardReceipt[];
  deliveries: DashboardDelivery[];
  transfers: DashboardTransfer[];
  categories: DashboardCategory[];
  warehouses: DashboardWarehouse[];
  locations: DashboardLocation[];
};

function EmptySection({
  title,
  description,
  icon: Icon,
  count,
}: {
  title: string;
  description: string;
  icon: typeof ClipboardList;
  count: number;
}) {
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
        <p className="mt-3 text-sm font-semibold text-slate-600">
          {count ? `${count} records to review` : "No records yet"}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          {count
            ? "Open the operations area to review them."
            : "This section will update when data is available."}
        </p>
      </div>
    </section>
  );
}

export function DashboardView({
  products,
  stockLevels,
  receipts,
  deliveries,
  transfers,
  categories,
  warehouses,
  locations,
}: DashboardViewProps) {
  const [docTypeFilter, setDocTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [warehouseFilter, setWarehouseFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  function handleReset() {
    setDocTypeFilter("all");
    setStatusFilter("all");
    setWarehouseFilter("all");
    setLocationFilter("all");
    setCategoryFilter("all");
  }

  // Location IDs matching selected warehouse
  const validLocationIds = useMemo(() => {
    if (locationFilter !== "all") {
      return new Set([locationFilter]);
    }
    if (warehouseFilter !== "all") {
      return new Set(
        locations
          .filter((loc) => loc.warehouse_id === warehouseFilter)
          .map((loc) => loc.id)
      );
    }
    return null;
  }, [locationFilter, warehouseFilter, locations]);

  // Compute stock per product, taking location/warehouse filter into account
  const stockByProduct = useMemo(() => {
    const map = new Map<string, number>();
    for (const level of stockLevels) {
      if (validLocationIds && level.location_id && !validLocationIds.has(level.location_id)) {
        continue;
      }
      map.set(level.product_id, (map.get(level.product_id) ?? 0) + Number(level.quantity));
    }
    return map;
  }, [stockLevels, validLocationIds]);

  // Filter products by category and location/warehouse
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (categoryFilter !== "all" && p.category_id !== categoryFilter) {
        return false;
      }
      return true;
    });
  }, [products, categoryFilter]);

  // Calculate metrics
  const totalProducts = filteredProducts.length;

  const lowStock = useMemo(() => {
    return filteredProducts.filter((product) => {
      const quantity = stockByProduct.get(product.id) ?? 0;
      return quantity > 0 && quantity <= Number(product.reorder_level);
    }).length;
  }, [filteredProducts, stockByProduct]);

  const outOfStock = useMemo(() => {
    return filteredProducts.filter((product) => {
      const quantity = stockByProduct.get(product.id) ?? 0;
      return quantity <= 0;
    }).length;
  }, [filteredProducts, stockByProduct]);

  // Filter operations based on document type, status, location/warehouse
  const filteredReceipts = useMemo(() => {
    if (docTypeFilter !== "all" && docTypeFilter !== "receipts") return [];
    return receipts.filter((r) => {
      if (statusFilter !== "all" && r.status.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      if (validLocationIds && !validLocationIds.has(r.destination_location_id)) {
        return false;
      }
      return true;
    });
  }, [receipts, docTypeFilter, statusFilter, validLocationIds]);

  const filteredDeliveries = useMemo(() => {
    if (docTypeFilter !== "all" && docTypeFilter !== "deliveries") return [];
    return deliveries.filter((d) => {
      if (statusFilter !== "all" && d.status.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      if (validLocationIds && !validLocationIds.has(d.source_location_id)) {
        return false;
      }
      return true;
    });
  }, [deliveries, docTypeFilter, statusFilter, validLocationIds]);

  const filteredTransfers = useMemo(() => {
    if (docTypeFilter !== "all" && docTypeFilter !== "transfers") return [];
    return transfers.filter((t) => {
      if (statusFilter !== "all" && t.status.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      if (
        validLocationIds &&
        !validLocationIds.has(t.source_location_id) &&
        !validLocationIds.has(t.destination_location_id)
      ) {
        return false;
      }
      return true;
    });
  }, [transfers, docTypeFilter, statusFilter, validLocationIds]);

  // Pending counts: if statusFilter is active, count matching; otherwise count incomplete (!['done', 'cancelled'])
  const pendingReceipts = useMemo(() => {
    if (statusFilter !== "all") {
      return filteredReceipts.length;
    }
    return filteredReceipts.filter((r) => !["done", "cancelled"].includes(r.status)).length;
  }, [filteredReceipts, statusFilter]);

  const pendingDeliveries = useMemo(() => {
    if (statusFilter !== "all") {
      return filteredDeliveries.length;
    }
    return filteredDeliveries.filter((d) => !["done", "cancelled"].includes(d.status)).length;
  }, [filteredDeliveries, statusFilter]);

  const pendingTransfers = useMemo(() => {
    if (statusFilter !== "all") {
      return filteredTransfers.length;
    }
    return filteredTransfers.filter((t) => !["done", "cancelled"].includes(t.status)).length;
  }, [filteredTransfers, statusFilter]);

  const kpis = [
    {
      label: "Total Products",
      value: totalProducts,
      hint: totalProducts ? "Products in catalog" : "No products yet",
      icon: Package,
      tone: "bg-sky-50 text-sky-600",
    },
    {
      label: "Low Stock",
      value: lowStock,
      hint: lowStock ? "Products need attention" : "Nothing to review",
      icon: TriangleAlert,
      tone: "bg-amber-50 text-amber-600",
    },
    {
      label: "Out of Stock",
      value: outOfStock,
      hint: outOfStock ? "Products need replenishment" : "No stock records",
      icon: Package,
      tone: "bg-rose-50 text-rose-600",
    },
    {
      label: "Pending Receipts",
      value: pendingReceipts,
      hint: pendingReceipts ? "Awaiting completion" : "No receipts yet",
      icon: ArrowDownToLine,
      tone: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Pending Deliveries",
      value: pendingDeliveries,
      hint: pendingDeliveries ? "Awaiting completion" : "No deliveries yet",
      icon: ArrowUpFromLine,
      tone: "bg-violet-50 text-violet-600",
    },
    {
      label: "Internal Transfers",
      value: pendingTransfers,
      hint: pendingTransfers ? "Awaiting completion" : "No transfers yet",
      icon: ArrowLeftRight,
      tone: "bg-orange-50 text-orange-600",
    },
  ];

  return (
    <section className="mx-auto max-w-7xl">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">
            Overview
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Dashboard
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
            A focused view of inventory health and movement across your network.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
          <RefreshCw className="size-3.5" /> Live inventory snapshot
        </div>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {kpis.map(({ label, value, hint, icon: Icon, tone }) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.35)]"
          >
            <div className="flex items-start justify-between gap-4">
              <p className="text-sm font-semibold text-slate-600">{label}</p>
              <span className={`flex size-9 items-center justify-center rounded-lg ${tone}`}>
                <Icon className="size-4.5" strokeWidth={1.8} />
              </span>
            </div>
            <p className="mt-5 text-3xl font-bold tracking-tight text-slate-950">{value}</p>
            <p className="mt-1 text-xs font-medium text-slate-400">{hint}</p>
          </div>
        ))}
      </div>

      <form
        className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.35)] sm:p-6"
        onSubmit={(e) => e.preventDefault()}
      >
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <Filter className="size-4.5" strokeWidth={1.8} />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Filter workspace</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Refine dashboard records when inventory data is available.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="text-left text-xs font-semibold text-emerald-700 hover:text-emerald-800"
          >
            Reset filters
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="space-y-2">
            <span className="block text-xs font-semibold text-slate-500">Document Type</span>
            <select
              value={docTypeFilter}
              onChange={(e) => setDocTypeFilter(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none focus:border-emerald-500 focus:ring-3 focus:ring-emerald-100"
            >
              <option value="all">All document types</option>
              <option value="receipts">Receipts</option>
              <option value="deliveries">Deliveries</option>
              <option value="transfers">Transfers</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="block text-xs font-semibold text-slate-500">Status</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none focus:border-emerald-500 focus:ring-3 focus:ring-emerald-100"
            >
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="ready">Ready</option>
              <option value="waiting">Waiting</option>
              <option value="done">Done</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="block text-xs font-semibold text-slate-500">Warehouse</span>
            <select
              value={warehouseFilter}
              onChange={(e) => {
                setWarehouseFilter(e.target.value);
                setLocationFilter("all");
              }}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none focus:border-emerald-500 focus:ring-3 focus:ring-emerald-100"
            >
              <option value="all">All warehouses</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name} ({wh.short_code})
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="block text-xs font-semibold text-slate-500">Location</span>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none focus:border-emerald-500 focus:ring-3 focus:ring-emerald-100"
            >
              <option value="all">All locations</option>
              {locations
                .filter((loc) => warehouseFilter === "all" || loc.warehouse_id === warehouseFilter)
                .map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.short_code} · {loc.name}
                  </option>
                ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="block text-xs font-semibold text-slate-500">Category</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none focus:border-emerald-500 focus:ring-3 focus:ring-emerald-100"
            >
              <option value="all">All categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </form>

      <div className="mt-8 grid gap-5 xl:grid-cols-2">
        <EmptySection
          title="Recent Receipts"
          description="Inbound documents awaiting completion."
          icon={ArrowDownToLine}
          count={pendingReceipts}
        />
        <EmptySection
          title="Recent Deliveries"
          description="Outbound documents awaiting completion."
          icon={ArrowUpFromLine}
          count={pendingDeliveries}
        />
        <EmptySection
          title="Recent Transfers"
          description="Internal movements awaiting completion."
          icon={ArrowLeftRight}
          count={pendingTransfers}
        />
        <EmptySection
          title="Low Stock Products"
          description="Products needing attention."
          icon={TriangleAlert}
          count={lowStock}
        />
      </div>

      <div className="mt-5 flex items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-xs text-slate-500">
        <Warehouse className="size-4 shrink-0 text-slate-400" /> Inventory metrics reflect the
        latest saved catalog and stock records.
      </div>
    </section>
  );
}
