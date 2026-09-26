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
  receipt_id: string;
  product_id: string;
  location_id: string;
  quantity: number;
  movement_type: "receipt";
  created_at: string;
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
    };
    Views: Record<string, never>;
    Functions: { complete_receipt: { Args: { p_receipt_id: string }; Returns: undefined } };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
