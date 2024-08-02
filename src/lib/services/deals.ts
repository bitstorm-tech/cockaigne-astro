import type { Category } from "@lib/models/category";
import type { DealHeader } from "@lib/models/deal-header";
import sql from "@lib/persistence/pg";

export async function getAllCategories(): Promise<Category[]> {
  return await sql`select * from categories`;
}

export async function getAllDealHeaders(): Promise<DealHeader[]> {
  return sql<DealHeader[]>`
	select d.id, d.dealer_id, d.title, d.category_id, d.start, a.username 
  	from deals d 
	join accounts a on d.dealer_id = a.id`;
}
