import { ProductList } from "@/components/products/product-list";
import { createClient } from "@/lib/supabase/server";
import type { Location, ProductWithStock } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const supabase = await createClient();

  const [
    { data: products, error: productsError },
    { data: categories, error: categoriesError },
    { data: locations, error: locationsError },
  ] = await Promise.all([
    supabase
      .from("products")
      .select("*, category:categories(*), stock_levels(*)")
      .order("name"),
    supabase.from("categories").select("name").order("name"),
    supabase.from("locations").select("*").order("name"),
  ]);

  if (productsError) {
    console.error("Error loading products on server:", productsError.message);
  }
  if (categoriesError) {
    console.error("Error loading categories on server:", categoriesError.message);
  }
  if (locationsError) {
    console.error("Error loading locations on server:", locationsError.message);
  }

  return (
    <ProductList
      initialProducts={(products ?? []) as ProductWithStock[]}
      initialCategories={(categories ?? []).map((cat) => cat.name)}
      initialLocations={(locations ?? []) as Location[]}
    />
  );
}
