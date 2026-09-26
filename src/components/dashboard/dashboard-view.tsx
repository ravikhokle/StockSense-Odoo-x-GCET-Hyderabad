"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpFromLine,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Filter,
  Layers,
  MapPin,
  Package,
  PackageCheck,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
  Warehouse,
  X,
} from "lucide-react";

export type DashboardProduct = {
  id: string;
  name: string;
  sku: string;
  category_id: string | null;
  unit?: string;
  reorder_level: number;
  created_at?: string;
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
  schedule_date?: string;
  created_at?: string;
};

export type DashboardDelivery = {
  id: string;
  reference: string;
  status: string;
  source_location_id: string;
  delivery_address: string;
  schedule_date?: string;
  created_at?: string;
};

export type DashboardTransfer = {
  id: string;
  reference: string;
  status: string;
  source_location_id: string;
  destination_location_id: string;
  schedule_date?: string;
  created_at?: string;
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

const statusStyles: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
  waiting: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
  ready: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  done: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  cancelled: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
};

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

  const hasActiveFilters =
    docTypeFilter !== "all" ||
    statusFilter !== "all" ||
    warehouseFilter !== "all" ||
    locationFilter !== "all" ||
    categoryFilter !== "all";

  function handleReset() {
    setDocTypeFilter("all");
    setStatusFilter("all");
    setWarehouseFilter("all");
    setLocationFilter("all");
    setCategoryFilter("all");
  }

  // Quick lookup maps
  const locationById = useMemo(() => {
    return new Map(locations.map((loc) => [loc.id, loc]));
  }, [locations]);

  const categoryById = useMemo(() => {
    return new Map(categories.map((c) => [c.id, c.name]));
  }, [categories]);

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

  // Compute total quantity per product based on active location filter
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

  // Filter products by category
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (categoryFilter !== "all" && p.category_id !== categoryFilter) {
        return false;
      }
      return true;
    });
  }, [products, categoryFilter]);

  // Calculate product metrics
  const totalProducts = filteredProducts.length;

  const lowStockProducts = useMemo(() => {
    return filteredProducts.filter((product) => {
      const quantity = stockByProduct.get(product.id) ?? 0;
      return quantity > 0 && quantity <= Number(product.reorder_level);
    });
  }, [filteredProducts, stockByProduct]);

  const outOfStockProducts = useMemo(() => {
    return filteredProducts.filter((product) => {
      const quantity = stockByProduct.get(product.id) ?? 0;
      return quantity <= 0;
    });
  }, [filteredProducts, stockByProduct]);

  const healthyProductsCount = Math.max(0, totalProducts - lowStockProducts.length - outOfStockProducts.length);

  const inStockPercentage = totalProducts > 0 ? Math.round((healthyProductsCount / totalProducts) * 100) : 0;
  const lowStockPercentage = totalProducts > 0 ? Math.round((lowStockProducts.length / totalProducts) * 100) : 0;
  const outOfStockPercentage = totalProducts > 0 ? Math.round((outOfStockProducts.length / totalProducts) * 100) : 0;

  // Filter receipts
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

  // Filter deliveries
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

  // Filter transfers
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

  // Pending counts
  const pendingReceipts = useMemo(() => {
    if (statusFilter !== "all") return filteredReceipts.length;
    return filteredReceipts.filter((r) => !["done", "cancelled"].includes(r.status)).length;
  }, [filteredReceipts, statusFilter]);

  const pendingDeliveries = useMemo(() => {
    if (statusFilter !== "all") return filteredDeliveries.length;
    return filteredDeliveries.filter((d) => !["done", "cancelled"].includes(d.status)).length;
  }, [filteredDeliveries, statusFilter]);

  const pendingTransfers = useMemo(() => {
    if (statusFilter !== "all") return filteredTransfers.length;
    return filteredTransfers.filter((t) => !["done", "cancelled"].includes(t.status)).length;
  }, [filteredTransfers, statusFilter]);

  // Stock volume by location calculation for analytics card
  const locationStockStats = useMemo(() => {
    const locMap = new Map<string, number>();
    for (const lvl of stockLevels) {
      if (lvl.location_id) {
        locMap.set(lvl.location_id, (locMap.get(lvl.location_id) ?? 0) + Number(lvl.quantity));
      }
    }
    return locations
      .map((loc) => ({
        id: loc.id,
        name: loc.name,
        shortCode: loc.short_code,
        units: locMap.get(loc.id) ?? 0,
      }))
      .sort((a, b) => b.units - a.units)
      .slice(0, 4);
  }, [locations, stockLevels]);

  const maxLocationUnits = Math.max(1, ...locationStockStats.map((l) => l.units));

  const kpis = [
    {
      label: "Total Products",
      value: totalProducts,
      hint: `${categories.length} categories active`,
      icon: Package,
      tone: "bg-sky-50 text-sky-600 ring-sky-100",
      accent: "from-sky-500/10 to-sky-500/0",
      link: "/products",
    },
    {
      label: "Low Stock Alert",
      value: lowStockProducts.length,
      hint: lowStockProducts.length ? "Requires replenishment" : "All levels optimal",
      icon: AlertTriangle,
      tone: lowStockProducts.length > 0 ? "bg-amber-50 text-amber-600 ring-amber-200" : "bg-slate-50 text-slate-400 ring-slate-100",
      accent: lowStockProducts.length > 0 ? "from-amber-500/10 to-amber-500/0" : "",
      link: "/products",
      warning: lowStockProducts.length > 0,
    },
    {
      label: "Out of Stock",
      value: outOfStockProducts.length,
      hint: outOfStockProducts.length ? "Immediate action needed" : "Zero depleted items",
      icon: Package,
      tone: outOfStockProducts.length > 0 ? "bg-rose-50 text-rose-600 ring-rose-200" : "bg-slate-50 text-slate-400 ring-slate-100",
      accent: outOfStockProducts.length > 0 ? "from-rose-500/10 to-rose-500/0" : "",
      link: "/products",
      warning: outOfStockProducts.length > 0,
    },
    {
      label: "Pending Receipts",
      value: pendingReceipts,
      hint: pendingReceipts ? "Awaiting dock completion" : "Dock queue clear",
      icon: ArrowDownToLine,
      tone: "bg-emerald-50 text-emerald-600 ring-emerald-100",
      accent: "from-emerald-500/10 to-emerald-500/0",
      link: "/operations/receipts",
    },
    {
      label: "Pending Deliveries",
      value: pendingDeliveries,
      hint: pendingDeliveries ? "Awaiting customer shipment" : "Outbound queue clear",
      icon: ArrowUpFromLine,
      tone: "bg-violet-50 text-violet-600 ring-violet-100",
      accent: "from-violet-500/10 to-violet-500/0",
      link: "/operations/deliveries",
    },
    {
      label: "Internal Transfers",
      value: pendingTransfers,
      hint: pendingTransfers ? "Active inter-warehouse moves" : "No movements in transit",
      icon: ArrowLeftRight,
      tone: "bg-amber-50 text-amber-600 ring-amber-100",
      accent: "from-amber-500/10 to-amber-500/0",
      link: "/operations/transfers",
    },
  ];

  return (
    <section className="mx-auto max-w-7xl space-y-8 pb-12">
      {/* Top Banner & Quick Action Center */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-linear-to-b from-white via-slate-50/50 to-white p-6 shadow-[0_12px_36px_-20px_rgba(15,23,42,0.12)] sm:p-8">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 size-72 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 -mb-16 size-72 rounded-full bg-sky-500/5 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/20">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Inventory Hub
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                <RefreshCw className="size-3 text-slate-400" /> Real-time sync
              </span>
            </div>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              Dashboard
            </h1>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-slate-500">
              Complete oversight of network inventory health, stock movements, and pending fulfillments.
            </p>
          </div>

          {/* Quick Create Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/products"
              className="inline-flex h-9.5 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-xs hover:border-emerald-300 hover:bg-emerald-50/40 hover:text-emerald-800 transition-all"
            >
              <Package className="size-3.5 text-emerald-600" /> + Add Product
            </Link>
            <Link
              href="/operations/receipts/new"
              className="inline-flex h-9.5 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-xs hover:border-emerald-300 hover:bg-emerald-50/40 hover:text-emerald-800 transition-all"
            >
              <ArrowDownToLine className="size-3.5 text-emerald-600" /> + Inbound Receipt
            </Link>
            <Link
              href="/operations/deliveries/new"
              className="inline-flex h-9.5 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-xs hover:border-violet-300 hover:bg-violet-50/40 hover:text-violet-800 transition-all"
            >
              <ArrowUpFromLine className="size-3.5 text-violet-600" /> + Outbound Delivery
            </Link>
            <Link
              href="/operations/transfers/new"
              className="inline-flex h-9.5 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-xs hover:border-amber-300 hover:bg-amber-50/40 hover:text-amber-800 transition-all"
            >
              <ArrowLeftRight className="size-3.5 text-amber-600" /> + Transfer
            </Link>
          </div>
        </div>

        {/* Health status summary strip */}
        <div className="mt-7 pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-100/70 text-emerald-700">
              <PackageCheck className="size-4.5" />
            </span>
            <div>
              <p className="text-xs font-bold text-slate-800">
                Network Stock Health: {inStockPercentage}% Optimal
              </p>
              <p className="text-[11px] text-slate-400">
                {healthyProductsCount} in stock · {lowStockProducts.length} low stock · {outOfStockProducts.length} depleted
              </p>
            </div>
          </div>
          {/* Tri-color progress meter */}
          <div className="w-full sm:w-64">
            <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100 shadow-inner">
              <div
                style={{ width: `${inStockPercentage}%` }}
                className="bg-emerald-500 transition-all duration-500"
                title={`In Stock: ${inStockPercentage}%`}
              />
              <div
                style={{ width: `${lowStockPercentage}%` }}
                className="bg-amber-400 transition-all duration-500"
                title={`Low Stock: ${lowStockPercentage}%`}
              />
              <div
                style={{ width: `${outOfStockPercentage}%` }}
                className="bg-rose-500 transition-all duration-500"
                title={`Out of Stock: ${outOfStockPercentage}%`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map(({ label, value, hint, icon: Icon, tone, accent, link, warning }) => (
          <Link
            key={label}
            href={link}
            className={`group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-lg hover:border-slate-300 transition-all duration-200 ${
              warning ? "ring-1 ring-amber-300/40" : ""
            }`}
          >
            {accent && (
              <div
                className={`absolute inset-x-0 top-0 h-1 bg-linear-to-r ${accent} opacity-80 group-hover:opacity-100 transition-opacity`}
              />
            )}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 group-hover:text-slate-900 transition-colors">
                  {label}
                </p>
                <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                  {value}
                </p>
              </div>
              <span className={`flex size-11 items-center justify-center rounded-xl ring-2 transition-transform duration-200 group-hover:scale-105 ${tone}`}>
                <Icon className="size-5.5" strokeWidth={1.9} />
              </span>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="text-xs font-medium text-slate-400 group-hover:text-slate-600 transition-colors">
                {hint}
              </span>
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                Inspect <ChevronRight className="size-3" />
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Filters Hub */}
      <form
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] sm:p-6"
        onSubmit={(e) => e.preventDefault()}
      >
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex items-center gap-3">
            <span className="flex size-9.5 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <SlidersHorizontal className="size-4.5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">Filter workspace</h2>
                {hasActiveFilters && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    Active
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                Refine metric cards and recent activity across warehouses, locations, and categories.
              </p>
            </div>
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              <X className="size-3.5" /> Reset all filters
            </button>
          )}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="space-y-1.5">
            <span className="block text-xs font-semibold text-slate-600">Document Type</span>
            <select
              value={docTypeFilter}
              onChange={(e) => setDocTypeFilter(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-3 focus:ring-emerald-100"
            >
              <option value="all">All document types</option>
              <option value="receipts">Receipts</option>
              <option value="deliveries">Deliveries</option>
              <option value="transfers">Transfers</option>
            </select>
          </label>

          <label className="space-y-1.5">
            <span className="block text-xs font-semibold text-slate-600">Status</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-3 focus:ring-emerald-100"
            >
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="ready">Ready</option>
              <option value="waiting">Waiting</option>
              <option value="done">Done</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>

          <label className="space-y-1.5">
            <span className="block text-xs font-semibold text-slate-600">Warehouse</span>
            <select
              value={warehouseFilter}
              onChange={(e) => {
                setWarehouseFilter(e.target.value);
                setLocationFilter("all");
              }}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-3 focus:ring-emerald-100"
            >
              <option value="all">All warehouses</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name} ({wh.short_code})
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1.5">
            <span className="block text-xs font-semibold text-slate-600">Location</span>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-3 focus:ring-emerald-100"
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

          <label className="space-y-1.5">
            <span className="block text-xs font-semibold text-slate-600">Category</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-3 focus:ring-emerald-100"
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

      {/* Real Operations & Activity Hub (Replaces Empty Boxes!) */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* Recent Deliveries Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className="flex size-9.5 items-center justify-center rounded-xl bg-violet-50 text-violet-600 ring-2 ring-violet-100">
                  <ArrowUpFromLine className="size-4.5" />
                </span>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Recent Deliveries</h2>
                  <p className="text-xs text-slate-500">Outbound fulfillment and customer dispatches</p>
                </div>
              </div>
              <Link
                href="/operations/deliveries"
                className="text-xs font-semibold text-violet-700 hover:text-violet-800 flex items-center gap-1"
              >
                View all <ChevronRight className="size-3.5" />
              </Link>
            </div>

            <div className="mt-4 divide-y divide-slate-100">
              {filteredDeliveries.length === 0 ? (
                <div className="py-10 text-center">
                  <ArrowUpFromLine className="mx-auto size-7 text-slate-300" />
                  <p className="mt-2 text-sm font-semibold text-slate-600">No deliveries matching criteria</p>
                  <p className="mt-1 text-xs text-slate-400">Create a delivery to start recording outbound moves.</p>
                  <Link
                    href="/operations/deliveries/new"
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-violet-700 hover:underline"
                  >
                    + Create new delivery
                  </Link>
                </div>
              ) : (
                filteredDeliveries.slice(0, 5).map((delivery) => (
                  <div key={delivery.id} className="flex items-center justify-between py-3 hover:bg-slate-50/60 rounded-lg px-2 -mx-2 transition-colors">
                    <div className="min-w-0 pr-3">
                      <Link
                        href={`/operations/deliveries/${delivery.id}`}
                        className="font-mono text-sm font-bold text-slate-900 hover:text-violet-700"
                      >
                        {delivery.reference}
                      </Link>
                      <p className="truncate text-xs text-slate-500 mt-0.5">
                        To: {delivery.delivery_address || "No address specified"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${statusStyles[delivery.status] ?? "bg-slate-100 text-slate-700"}`}>
                        {delivery.status.toUpperCase()}
                      </span>
                      <Link
                        href={`/operations/deliveries/${delivery.id}`}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      >
                        <ChevronRight className="size-4" />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          {filteredDeliveries.length > 5 && (
            <p className="mt-3 pt-3 border-t border-slate-100 text-center text-xs font-medium text-slate-400">
              Showing 5 of {filteredDeliveries.length} matching deliveries
            </p>
          )}
        </div>

        {/* Recent Receipts Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className="flex size-9.5 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-2 ring-emerald-100">
                  <ArrowDownToLine className="size-4.5" />
                </span>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Recent Receipts</h2>
                  <p className="text-xs text-slate-500">Inbound vendor shipments and receipts</p>
                </div>
              </div>
              <Link
                href="/operations/receipts"
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
              >
                View all <ChevronRight className="size-3.5" />
              </Link>
            </div>

            <div className="mt-4 divide-y divide-slate-100">
              {filteredReceipts.length === 0 ? (
                <div className="py-10 text-center">
                  <ArrowDownToLine className="mx-auto size-7 text-slate-300" />
                  <p className="mt-2 text-sm font-semibold text-slate-600">No receipts matching criteria</p>
                  <p className="mt-1 text-xs text-slate-400">Schedule a receipt to begin receiving inventory.</p>
                  <Link
                    href="/operations/receipts/new"
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:underline"
                  >
                    + Create new receipt
                  </Link>
                </div>
              ) : (
                filteredReceipts.slice(0, 5).map((receipt) => (
                  <div key={receipt.id} className="flex items-center justify-between py-3 hover:bg-slate-50/60 rounded-lg px-2 -mx-2 transition-colors">
                    <div className="min-w-0 pr-3">
                      <Link
                        href={`/operations/receipts/${receipt.id}`}
                        className="font-mono text-sm font-bold text-slate-900 hover:text-emerald-700"
                      >
                        {receipt.reference}
                      </Link>
                      <p className="truncate text-xs text-slate-500 mt-0.5">
                        Vendor: {receipt.vendor_name || "Vendor unspecified"} · Dest: {locationById.get(receipt.destination_location_id)?.short_code ?? "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${statusStyles[receipt.status] ?? "bg-slate-100 text-slate-700"}`}>
                        {receipt.status.toUpperCase()}
                      </span>
                      <Link
                        href={`/operations/receipts/${receipt.id}`}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      >
                        <ChevronRight className="size-4" />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          {filteredReceipts.length > 5 && (
            <p className="mt-3 pt-3 border-t border-slate-100 text-center text-xs font-medium text-slate-400">
              Showing 5 of {filteredReceipts.length} matching receipts
            </p>
          )}
        </div>

        {/* Recent Transfers Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className="flex size-9.5 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-2 ring-amber-100">
                  <ArrowLeftRight className="size-4.5" />
                </span>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Internal Transfers</h2>
                  <p className="text-xs text-slate-500">Inventory balance moves between locations</p>
                </div>
              </div>
              <Link
                href="/operations/transfers"
                className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1"
              >
                View all <ChevronRight className="size-3.5" />
              </Link>
            </div>

            <div className="mt-4 divide-y divide-slate-100">
              {filteredTransfers.length === 0 ? (
                <div className="py-10 text-center">
                  <ArrowLeftRight className="mx-auto size-7 text-slate-300" />
                  <p className="mt-2 text-sm font-semibold text-slate-600">No transfers recorded</p>
                  <p className="mt-1 text-xs text-slate-400">Relocate stock between warehouses and locations.</p>
                  <Link
                    href="/operations/transfers/new"
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:underline"
                  >
                    + Create new transfer
                  </Link>
                </div>
              ) : (
                filteredTransfers.slice(0, 5).map((transfer) => {
                  const src = locationById.get(transfer.source_location_id);
                  const dst = locationById.get(transfer.destination_location_id);
                  return (
                    <div key={transfer.id} className="flex items-center justify-between py-3 hover:bg-slate-50/60 rounded-lg px-2 -mx-2 transition-colors">
                      <div className="min-w-0 pr-3">
                        <Link
                          href={`/operations/transfers/${transfer.id}`}
                          className="font-mono text-sm font-bold text-slate-900 hover:text-amber-700"
                        >
                          {transfer.reference}
                        </Link>
                        <p className="truncate text-xs text-slate-500 mt-0.5">
                          {src?.short_code ?? "Source"} → {dst?.short_code ?? "Dest"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${statusStyles[transfer.status] ?? "bg-slate-100 text-slate-700"}`}>
                          {transfer.status.toUpperCase()}
                        </span>
                        <Link
                          href={`/operations/transfers/${transfer.id}`}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        >
                          <ChevronRight className="size-4" />
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          {filteredTransfers.length > 5 && (
            <p className="mt-3 pt-3 border-t border-slate-100 text-center text-xs font-medium text-slate-400">
              Showing 5 of {filteredTransfers.length} matching transfers
            </p>
          )}
        </div>

        {/* Low Stock & Critical Inventory Alerts */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className="flex size-9.5 items-center justify-center rounded-xl bg-rose-50 text-rose-600 ring-2 ring-rose-100">
                  <AlertTriangle className="size-4.5" />
                </span>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Critical Stock Watch</h2>
                  <p className="text-xs text-slate-500">Products requiring restock replenishment</p>
                </div>
              </div>
              <Link
                href="/products"
                className="text-xs font-semibold text-rose-700 hover:text-rose-800 flex items-center gap-1"
              >
                Catalog <ChevronRight className="size-3.5" />
              </Link>
            </div>

            <div className="mt-4 divide-y divide-slate-100">
              {lowStockProducts.length === 0 && outOfStockProducts.length === 0 ? (
                <div className="py-10 text-center">
                  <CheckCircle2 className="mx-auto size-7 text-emerald-500" />
                  <p className="mt-2 text-sm font-semibold text-slate-700">Healthy Stock Levels</p>
                  <p className="mt-1 text-xs text-slate-400">All catalog products are above minimum threshold.</p>
                </div>
              ) : (
                [...outOfStockProducts, ...lowStockProducts].slice(0, 5).map((prod) => {
                  const qty = stockByProduct.get(prod.id) ?? 0;
                  const isOut = qty <= 0;
                  return (
                    <div key={prod.id} className="flex items-center justify-between py-3 hover:bg-slate-50/60 rounded-lg px-2 -mx-2 transition-colors">
                      <div className="min-w-0 pr-3">
                        <Link
                          href={`/products/${prod.id}`}
                          className="font-semibold text-sm text-slate-900 hover:text-emerald-700 truncate block"
                        >
                          {prod.name}
                        </Link>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">
                          {prod.sku} · Reorder: {prod.reorder_level} {prod.unit ?? "units"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            isOut ? "bg-rose-50 text-rose-700 ring-1 ring-rose-200" : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                          }`}
                        >
                          {isOut ? "0 on hand" : `${qty} on hand`}
                        </span>
                        <Link
                          href="/operations/receipts/new"
                          title="Create Restock Receipt"
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-emerald-50 hover:text-emerald-700"
                        >
                          <Plus className="size-4" />
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          {lowStockProducts.length + outOfStockProducts.length > 5 && (
            <p className="mt-3 pt-3 border-t border-slate-100 text-center text-xs font-medium text-slate-400">
              Showing 5 of {lowStockProducts.length + outOfStockProducts.length} items needing attention
            </p>
          )}
        </div>
      </div>

      {/* Network Storage Distribution Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Storage Location Utilization */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] sm:p-6">
          <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <MapPin className="size-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Stock by Storage Location</h3>
                <p className="text-xs text-slate-400">Physical units allocated per site</p>
              </div>
            </div>
            <Link href="/locations" className="text-xs font-semibold text-emerald-700 hover:underline">
              Locations →
            </Link>
          </div>
          <div className="mt-5 space-y-3.5">
            {locationStockStats.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">No locations configured yet.</p>
            ) : (
              locationStockStats.map((loc) => {
                const pct = Math.round((loc.units / maxLocationUnits) * 100);
                return (
                  <div key={loc.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-700 flex items-center gap-1.5">
                        <span className="font-mono text-slate-400">{loc.shortCode}</span> · {loc.name}
                      </span>
                      <span className="text-slate-900">{loc.units} units</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        style={{ width: `${pct}%` }}
                        className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] sm:p-6">
          <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
                <Layers className="size-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Catalog Categories</h3>
                <p className="text-xs text-slate-400">Distribution across product lines</p>
              </div>
            </div>
            <Link href="/products" className="text-xs font-semibold text-sky-700 hover:underline">
              Catalog →
            </Link>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {categories.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400 w-full">No categories created yet.</p>
            ) : (
              categories.map((cat) => {
                const count = products.filter((p) => p.category_id === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryFilter(categoryFilter === cat.id ? "all" : cat.id)}
                    className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-medium border transition-all ${
                      categoryFilter === cat.id
                        ? "border-sky-500 bg-sky-50 text-sky-800 ring-2 ring-sky-200"
                        : "border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-white hover:border-slate-300"
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600 shadow-xs border border-slate-200">
                      {count}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Network Infrastructure Summary Footer */}
      <div className="flex items-center justify-between rounded-2xl border border-slate-200/90 bg-slate-50/60 px-5 py-4 text-xs text-slate-500 shadow-xs">
        <div className="flex items-center gap-2.5">
          <Warehouse className="size-4 text-slate-400 shrink-0" />
          <span>
            Connected to <strong>{warehouses.length}</strong> warehouses across <strong>{locations.length}</strong> active storage zones.
          </span>
        </div>
        <Link
          href="/move-history"
          className="font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
        >
          Audit Move History <ExternalLink className="size-3" />
        </Link>
      </div>
    </section>
  );
}
