"use server";

import { revalidatePath } from "next/cache";

export async function revalidateInventory(path?: string) {
  try {
    revalidatePath("/", "layout");
    if (path) {
      revalidatePath(path);
    }
  } catch (error) {
    console.error("Failed to revalidate inventory:", error);
  }
}
