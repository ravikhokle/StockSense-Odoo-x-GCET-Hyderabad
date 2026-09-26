"use client";

import { useState, useSyncExternalStore } from "react";
import type { Location } from "@/types/database";

const storageKey = "stocksense.inventory-preferences";
const defaultPreferences = { defaultLocation: "", lowStockAlerts: true };

function readPreferences() {
  if (typeof window === "undefined") return defaultPreferences;
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) ?? "{}");
    return { defaultLocation: typeof stored.defaultLocation === "string" ? stored.defaultLocation : "", lowStockAlerts: stored.lowStockAlerts !== false };
  } catch {
    return defaultPreferences;
  }
}

function subscribeToPreferences(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

export function InventorySettings({ locations }: { locations: Location[] }) {
  const storedPreferences = useSyncExternalStore(subscribeToPreferences, readPreferences, () => defaultPreferences);
  const [draftLocation, setDraftLocation] = useState<string | null>(null); const [draftAlerts, setDraftAlerts] = useState<boolean | null>(null); const [saved, setSaved] = useState(false);
  const defaultLocation = draftLocation ?? storedPreferences.defaultLocation; const lowStockAlerts = draftAlerts ?? storedPreferences.lowStockAlerts;
  function save() { localStorage.setItem(storageKey, JSON.stringify({ defaultLocation, lowStockAlerts })); window.dispatchEvent(new StorageEvent("storage", { key: storageKey })); setSaved(true); }
  return <div className="space-y-6"><label className="block space-y-1.5"><span className="text-xs font-bold text-slate-600">Default location</span><select value={defaultLocation} onChange={(event) => { setDraftLocation(event.target.value); setSaved(false); }} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500"><option value="">No default location</option>{locations.map((location) => <option key={location.id} value={location.id}>{location.short_code} · {location.name}</option>)}</select><span className="text-xs text-slate-500">Preselect this location when starting inventory operations.</span></label><label className="flex items-start gap-3 rounded-lg border border-slate-200 p-4"><input type="checkbox" checked={lowStockAlerts} onChange={(event) => { setDraftAlerts(event.target.checked); setSaved(false); }} className="mt-0.5 size-4 accent-emerald-600" /><span><span className="block text-sm font-semibold text-slate-800">Show low-stock warnings</span><span className="mt-1 block text-xs leading-5 text-slate-500">Keep low-stock indicators visible across the inventory workspace.</span></span></label><div className="flex items-center gap-3"><button type="button" onClick={save} className="h-10 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white">Save preferences</button>{saved && <span className="text-sm font-medium text-emerald-700">Preferences saved.</span>}</div></div>;
}