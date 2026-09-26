import { MoveHistoryView, type MoveHistoryLocation, type MoveHistoryRow, type MoveHistoryWarehouse } from "@/components/move-history/move-history-view";
import { createClient } from "@/lib/supabase/server";
import type { Adjustment, Delivery, Location, Product, Receipt, StockMovement, Transfer, Warehouse } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function MoveHistoryPage() {
  const supabase = await createClient();
  const [{ data: movementData }, { data: productData }, { data: locationData }, { data: warehouseData }, { data: receiptData }, { data: deliveryData }, { data: transferData }, { data: adjustmentData }] = await Promise.all([
    supabase.from("stock_movements").select("*").order("created_at", { ascending: false }),
    supabase.from("products").select("id,name,unit"),
    supabase.from("locations").select("*"),
    supabase.from("warehouses").select("*"),
    supabase.from("receipts").select("id,reference,vendor_name,status,destination_location_id"),
    supabase.from("deliveries").select("id,reference,delivery_address,status,source_location_id"),
    supabase.from("transfers").select("id,reference,responsible,status,source_location_id,destination_location_id"),
    supabase.from("adjustments").select("id,reason,status,location_id"),
  ]);
  const movements = (movementData ?? []) as StockMovement[];
  const products = (productData ?? []) as Pick<Product, "id" | "name" | "unit">[];
  const locations = (locationData ?? []) as Location[];
  const warehouses = (warehouseData ?? []) as Warehouse[];
  const receipts = (receiptData ?? []) as Pick<Receipt, "id" | "reference" | "vendor_name" | "status" | "destination_location_id">[];
  const deliveries = (deliveryData ?? []) as Pick<Delivery, "id" | "reference" | "delivery_address" | "status" | "source_location_id">[];
  const transfers = (transferData ?? []) as Pick<Transfer, "id" | "reference" | "responsible" | "status" | "source_location_id" | "destination_location_id">[];
  const adjustments = (adjustmentData ?? []) as Pick<Adjustment, "id" | "reason" | "status" | "location_id">[];
  const productById = new Map(products.map((product) => [product.id, product]));
  const locationById = new Map(locations.map((location) => [location.id, location]));
  const locationLabel = (id: string | null) => { if (!id) return "-"; const location = locationById.get(id); return location ? `${location.short_code} · ${location.name}` : "-"; };
  const warehouseIdsFor = (locationIds: string[]) => locationIds.flatMap((id) => { const location = locationById.get(id); return location ? [location.warehouse_id] : []; });
  const rows: MoveHistoryRow[] = movements.map((movement) => {
    const product = productById.get(movement.product_id);
    const receipt = movement.receipt_id ? receipts.find((item) => item.id === movement.receipt_id) : undefined;
    const delivery = movement.delivery_id ? deliveries.find((item) => item.id === movement.delivery_id) : undefined;
    const transfer = movement.transfer_id ? transfers.find((item) => item.id === movement.transfer_id) : undefined;
    const adjustment = movement.adjustment_id ? adjustments.find((item) => item.id === movement.adjustment_id) : undefined;
    const locationIds = [movement.location_id, movement.from_location_id, movement.to_location_id].filter((id): id is string => Boolean(id));
    const from = receipt ? "Vendor" : delivery ? locationLabel(delivery.source_location_id) : transfer ? locationLabel(transfer.source_location_id) : adjustment ? (movement.quantity < 0 ? locationLabel(adjustment.location_id) : "Stock count") : locationLabel(movement.from_location_id);
    const to = receipt ? locationLabel(receipt.destination_location_id) : delivery ? delivery.delivery_address : transfer ? locationLabel(transfer.destination_location_id) : adjustment ? (movement.quantity < 0 ? "Stock count" : locationLabel(adjustment.location_id)) : locationLabel(movement.to_location_id);
    return { id: movement.id, reference: receipt?.reference ?? delivery?.reference ?? transfer?.reference ?? (adjustment ? `ADJ-${adjustment.id.slice(0, 8).toUpperCase()}` : "-"), date: movement.created_at, contact: receipt?.vendor_name ?? delivery?.delivery_address ?? transfer?.responsible ?? adjustment?.reason ?? "-", product: product?.name ?? movement.product_id, from, to, quantity: Number(movement.quantity), unit: product?.unit ?? "units", type: movement.movement_type, status: receipt?.status ?? delivery?.status ?? transfer?.status ?? adjustment?.status ?? "-", locationIds, warehouseIds: warehouseIdsFor(locationIds) };
  });
  const locationOptions: MoveHistoryLocation[] = locations.map((location) => ({ id: location.id, name: location.name, shortCode: location.short_code, warehouseId: location.warehouse_id }));
  const warehouseOptions: MoveHistoryWarehouse[] = warehouses.map((warehouse) => ({ id: warehouse.id, name: warehouse.name, shortCode: warehouse.short_code }));
  return <MoveHistoryView rows={rows} locations={locationOptions} warehouses={warehouseOptions} />;
}
