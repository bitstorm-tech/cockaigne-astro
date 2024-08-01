import type { Category } from "@lib/models/category";
import sql from "@lib/persistence/pg";

export async function getAllCategories(): Promise<Category[]> {
  return await sql`select * from categories`;
}
