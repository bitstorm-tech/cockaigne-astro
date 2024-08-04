import type { Category } from "@lib/models/category";
import type { DealHeader } from "@lib/models/deal-header";
import sql from "@lib/services/pg";
import logger from "@lib/utils/logger";

export type DealState = "active" | "past" | "future" | "template";

const stateToTableMap = new Map<DealState, string>([
  ["active", "active_deals_vew"],
  ["past", "past_deals_view"],
  ["future", "future_deals_view"],
  ["template", "deals"],
]);

stateToTableMap.set("active", "active_deals_view");

export async function getAllCategories(): Promise<Category[]> {
  return await sql`select * from categories`;
}

export interface GetDealHeadersArguments {
  state: DealState;
  dealerId?: string;
}

export async function getDealHeaders({ state, dealerId }: GetDealHeadersArguments): Promise<DealHeader[]> {
  const table = stateToTableMap.get(state) || "";
  if (!table) {
    logger.error(`Invalid deal state: ${state}`);
    return [];
  }

  const withDealerId = (dealerId: string | undefined) => (dealerId ? sql`where dealer_id = ${dealerId}` : sql``);

  return sql<DealHeader[]>`
	select d.id, d.dealer_id, d.title, d.category_id, d.start, a.username 
  	from ${sql(table)} d 
	join accounts a on d.dealer_id = a.id
	${withDealerId(dealerId)}`;
}
