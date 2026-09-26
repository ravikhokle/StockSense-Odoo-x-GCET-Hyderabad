import { z } from "zod";

export const adjustmentSchema = z.object({
  productId: z.string().uuid("Select a product."),
  locationId: z.string().uuid("Select a location."),
  countedQuantity: z.coerce.number().min(0, "Counted quantity cannot be negative."),
  reason: z.string().trim().min(1, "Enter a reason."),
});

export type AdjustmentFormValues = z.infer<typeof adjustmentSchema>;