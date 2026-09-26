export type Category = {
  id: string;
  name: string;
  created_at: string;
};

export type Product = {
  id: string;
  name: string;
  sku: string;
  category_id: string | null;
  unit: string;
  reorder_level: number;
  created_at: string;
  updated_at: string;
  category?: Category | null;
};

export type StockLevel = {
  id: string;
  product_id: string;
  location_name: string;
  quantity: number;
  reserved_quantity: number;
  created_at: string;
  updated_at: string;
  location_id: string | null;
};

export type Warehouse = {
  id: string;
  name: string;
  short_code: string;
  address: string;
  created_at: string;
  updated_at: string;
};

export type Location = {
  id: string;
  warehouse_id: string;
  name: string;
  short_code: string;
  created_at: string;
  updated_at: string;
  warehouse?: Warehouse | null;
};

export type ReceiptStatus = "draft" | "ready" | "done" | "cancelled";

export type Receipt = {
  id: string;
  reference: string;
  vendor_name: string;
  destination_location_id: string;
  schedule_date: string;
  responsible: string;
  status: ReceiptStatus;
  created_at: string;
  updated_at: string;
  destination_location?: Location | null;
};

export type ReceiptItem = {
  id: string;
  receipt_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  product?: Product | null;
};

export type StockMovement = {
  id: string;
  receipt_id: string | null;
  delivery_id: string | null;
  transfer_id: string | null;
  adjustment_id: string | null;
  product_id: string;
  location_id: string;
  from_location_id: string | null;
  to_location_id: string | null;
  quantity: number;
  movement_type: "receipt" | "delivery" | "transfer" | "adjustment";
  created_at: string;
};

export type TransferStatus = "draft" | "ready" | "done" | "cancelled";

export type Transfer = {
  id: string;
  reference: string;
  source_location_id: string;
  destination_location_id: string;
  responsible: string;
  schedule_date: string;
  status: TransferStatus;
  created_at: string;
  updated_at: string;
  source_location?: Location | null;
  destination_location?: Location | null;
};

export type TransferItem = {
  id: string;
  transfer_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  product?: Product | null;
};

export type AdjustmentStatus = "draft" | "validated" | "cancelled";

export type Adjustment = {
  id: string;
  location_id: string;
  reason: string;
  status: AdjustmentStatus;
  validated_by: string | null;
  validated_at: string | null;
  created_at: string;
  updated_at: string;
  location?: Location | null;
};

export type AdjustmentItem = {
  id: string;
  adjustment_id: string;
  product_id: string;
  current_quantity: number;
  counted_quantity: number;
  difference: number;
  created_at: string;
  product?: Product | null;
};

export type DeliveryStatus = "draft" | "waiting" | "ready" | "done" | "cancelled";

export type Delivery = {
  id: string;
  reference: string;
  delivery_address: string;
  responsible: string;
  operation_type: string;
  source_location_id: string;
  schedule_date: string;
  status: DeliveryStatus;
  created_at: string;
  updated_at: string;
  source_location?: Location | null;
};

export type DeliveryItem = {
  id: string;
  delivery_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  product?: Product | null;
};

export type ProductWithStock = Product & {
  stock_levels: StockLevel[];
};

export type Database = {
  public: {
    Tables: {
      categories: { Row: Category; Insert: Omit<Category, "id" | "created_at">; Update: Partial<Omit<Category, "id" | "created_at">> };
      products: { Row: Product; Insert: Omit<Product, "id" | "created_at" | "updated_at" | "category">; Update: Partial<Omit<Product, "id" | "created_at" | "updated_at" | "category">> };
      stock_levels: { Row: StockLevel; Insert: Omit<StockLevel, "id" | "created_at" | "updated_at">; Update: Partial<Omit<StockLevel, "id" | "created_at" | "updated_at">> };
      warehouses: { Row: Warehouse; Insert: Omit<Warehouse, "id" | "created_at" | "updated_at">; Update: Partial<Omit<Warehouse, "id" | "created_at" | "updated_at">> };
      locations: { Row: Location; Insert: Omit<Location, "id" | "created_at" | "updated_at" | "warehouse">; Update: Partial<Omit<Location, "id" | "created_at" | "updated_at" | "warehouse">> };
      receipts: { Row: Receipt; Insert: Omit<Receipt, "id" | "created_at" | "updated_at" | "destination_location">; Update: Partial<Omit<Receipt, "id" | "created_at" | "updated_at" | "destination_location">> };
      receipt_items: { Row: ReceiptItem; Insert: Omit<ReceiptItem, "id" | "created_at" | "product">; Update: Partial<Omit<ReceiptItem, "id" | "created_at" | "product">> };
      stock_movements: { Row: StockMovement; Insert: Omit<StockMovement, "id" | "created_at">; Update: Partial<Omit<StockMovement, "id" | "created_at">> };
      transfers: { Row: Transfer; Insert: Omit<Transfer, "id" | "created_at" | "updated_at" | "source_location" | "destination_location">; Update: Partial<Omit<Transfer, "id" | "created_at" | "updated_at" | "source_location" | "destination_location">> };
      transfer_items: { Row: TransferItem; Insert: Omit<TransferItem, "id" | "created_at" | "product">; Update: Partial<Omit<TransferItem, "id" | "created_at" | "product">> };
      adjustments: { Row: Adjustment; Insert: Omit<Adjustment, "id" | "created_at" | "updated_at" | "location">; Update: Partial<Omit<Adjustment, "id" | "created_at" | "updated_at" | "location">> };
      adjustment_items: { Row: AdjustmentItem; Insert: Omit<AdjustmentItem, "id" | "created_at" | "product" | "difference">; Update: Partial<Omit<AdjustmentItem, "id" | "created_at" | "product" | "difference">> };
      deliveries: { Row: Delivery; Insert: Omit<Delivery, "id" | "created_at" | "updated_at" | "source_location">; Update: Partial<Omit<Delivery, "id" | "created_at" | "updated_at" | "source_location">> };
      delivery_items: { Row: DeliveryItem; Insert: Omit<DeliveryItem, "id" | "created_at" | "product">; Update: Partial<Omit<DeliveryItem, "id" | "created_at" | "product">> };
    };
    Views: Record<string, never>;
    Functions: { complete_receipt: { Args: { p_receipt_id: string }; Returns: undefined }; complete_delivery: { Args: { p_delivery_id: string }; Returns: undefined }; complete_transfer: { Args: { p_transfer_id: string }; Returns: undefined }; validate_adjustment: { Args: { p_adjustment_id: string }; Returns: undefined } };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
