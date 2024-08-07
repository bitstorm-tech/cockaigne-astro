import type { Category } from "@lib/models/category";
import type { DealDetails } from "@lib/models/deal-details";
import type { DealHeader } from "@lib/models/deal-header";
import sql from "@lib/services/pg";
import dayjs from "dayjs";
import { getDealImageUrls } from "./imagekit";
import logger from "./logger";

export type DealState = "active" | "past" | "future" | "template";

const stateToTableMap = new Map<DealState, string>([
  ["active", "active_deals_view"],
  ["past", "past_deals_view"],
  ["future", "future_deals_view"],
  ["template", "deals"],
]);

export async function getAllCategories(): Promise<Category[]> {
  return await sql`select * from categories`;
}

export async function getDealHeaders(state: DealState, dealerId?: string): Promise<DealHeader[]> {
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

export async function getDealDetails(dealId: string): Promise<DealDetails | undefined> {
  const result = await sql`select title, description, start, duration_in_hours from deals where id = ${dealId}`;

  if (result.length === 0) {
    logger.error(`Can't find deal details for ID ${dealId}`);
    return;
  }

  const startDate = dayjs(result[0].start);
  const imageUrls = await getDealImageUrls(dealId, 400);

  const dealDetails: DealDetails = {
    description: result[0].description,
    imageUrls,
    start: startDate.format("DD.MM.YYYY"),
    end: startDate.add(result[0].durationInHours, "hours").format("DD.MM.YYYY"),
  };

  return dealDetails;
}

export async function incrementDealViewCount(dealId: string, userId: string): Promise<void> {
  await sql`insert into deal_clicks (deal_id, account_id) values (${dealId}, ${userId}) on conflict do nothing`;
}

export async function toggleDealLike(dealId: string, userId: string): Promise<number> {
  const count = await sql`select count(*) from likes where deal_id = ${dealId} and user_id = ${userId}`;

  if (count[0].count == 0) {
    await sql`insert into likes (deal_id, user_id) values (${dealId}, ${userId})`;
  } else {
    await sql`delete from likes where deal_id = ${dealId} and user_id = ${userId}`;
  }

  return getDealLikes(dealId);
}

export async function getDealLikes(dealId: string): Promise<number> {
  const likes = await sql`select likecount from like_counts_view where deal_id = ${dealId}`;

  if (likes.length === 0) {
    return 0;
  }

  return likes[0].likecount;
}

export async function isDealLikedByUser(dealId: string, userId: string): Promise<boolean> {
  const result = await sql`select exists(select user_id from likes where deal_id = ${dealId} and user_id = ${userId})`;
  return result[0].exists;
}
