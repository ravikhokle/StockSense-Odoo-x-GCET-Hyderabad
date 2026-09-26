export function formatProductDatabaseError(message: string) {
  if (message.includes("Could not find the table 'public.categories'") || message.includes("Could not find the table 'public.products'") || message.includes("Could not find the table 'public.stock_levels'")) {
    return "Product tables are not installed in Supabase yet. Run supabase/migrations/20260926000300_create_product_tables.sql in the Supabase SQL Editor, then refresh this page.";
  }

  return message;
}
