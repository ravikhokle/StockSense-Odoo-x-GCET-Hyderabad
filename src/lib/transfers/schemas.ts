import { z } from "zod";

export const transferSchema = z.object({
  sourceLocationId: z.string().uuid("Select a source location."),
  destinationLocationId: z.string().uuid("Select a destination location."),
  responsible: z.string().trim().min(1, "Enter a responsible person."),
  scheduleDate: z.string().min(1, "Select a schedule date."),
  items: z.array(z.object({ productId: z.string().uuid("Select a product."), quantity: z.coerce.number().positive("Quantity must be greater than zero.") })).min(1, "Add at least one product."),
}).refine((values) => values.sourceLocationId !== values.destinationLocationId, { message: "Source and destination must be different.", path: ["destinationLocationId"] });

export type TransferFormValues = z.infer<typeof transferSchema>;