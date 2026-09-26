import { z } from "zod";

export const receiptSchema = z.object({
  vendorName: z.string().trim().min(1, "Enter a vendor or source."),
  destinationLocationId: z.string().uuid("Select a destination location."),
  scheduleDate: z.string().min(1, "Select a schedule date."),
  responsible: z.string().trim().min(1, "Enter a responsible person."),
  items: z.array(z.object({ productId: z.string().uuid("Select a product."), quantity: z.coerce.number().positive("Quantity must be greater than zero.") })).min(1, "Add at least one product."),
});

export type ReceiptFormValues = z.infer<typeof receiptSchema>;
