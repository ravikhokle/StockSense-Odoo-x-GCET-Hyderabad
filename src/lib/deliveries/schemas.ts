import { z } from "zod";

export const deliverySchema = z.object({
  deliveryAddress: z.string().trim().min(1, "Enter a delivery address."),
  responsible: z.string().trim().min(1, "Enter a responsible person."),
  operationType: z.string().trim().min(1, "Enter an operation type."),
  sourceLocationId: z.string().uuid("Select a source location."),
  scheduleDate: z.string().min(1, "Select a schedule date."),
  items: z.array(z.object({ productId: z.string().uuid("Select a product."), quantity: z.coerce.number().positive("Quantity must be greater than zero.") })).min(1, "Add at least one product."),
});

export type DeliveryFormValues = z.infer<typeof deliverySchema>;
