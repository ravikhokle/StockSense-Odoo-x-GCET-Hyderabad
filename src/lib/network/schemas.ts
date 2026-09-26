import { z } from "zod";

export const warehouseSchema = z.object({
  name: z.string().trim().min(1, "Enter a warehouse name."),
  shortCode: z.string().trim().min(1, "Enter a short code.").max(20, "Short code must be 20 characters or fewer."),
  address: z.string().trim().min(1, "Enter an address."),
});

export const locationSchema = z.object({
  name: z.string().trim().min(1, "Enter a location name."),
  shortCode: z.string().trim().min(1, "Enter a short code.").max(30, "Short code must be 30 characters or fewer."),
  warehouseId: z.string().uuid("Select a warehouse."),
});

export type WarehouseFormValues = z.infer<typeof warehouseSchema>;
export type LocationFormValues = z.infer<typeof locationSchema>;
