import { z } from "zod";

export const productSchema = z.object({
  name: z.string().trim().min(1, "Enter a product name."),
  sku: z.string().trim().min(1, "Enter an SKU or code."),
  category: z.string().trim().min(1, "Enter a category."),
  unit: z.string().trim().min(1, "Enter a unit of measure."),
  initialStock: z.coerce.number().min(0, "Initial stock cannot be negative."),
  initialStockLocationId: z.string().uuid("Select an initial stock location.").or(z.literal("")),
  reorderLevel: z.coerce.number().min(0, "Reorder level cannot be negative."),
}).superRefine((values, context) => {
  if (values.initialStock > 0 && !values.initialStockLocationId) context.addIssue({ code: "custom", path: ["initialStockLocationId"], message: "Select where the initial stock is stored." });
});

export type ProductFormValues = z.infer<typeof productSchema>;
export type ProductFormInput = z.input<typeof productSchema>;
