import type { DealHeader } from "@lib/models/deal-header";
import type { DealStatistics } from "@lib/models/deal-statistics";
import type { Rating, RatingUpsert } from "@lib/models/rating";
import logger from "./logger";
import sql from "./pg";

export async function getDefaultCategoryId(dealerId: string): Promise<number> {
	const [result] = await sql`select default_category from accounts where id = ${dealerId}`;

	if (!result) {
		return 0;
	}

	return result.defaultCategory;
}

export async function getDealerRating(dealerId: string, userId: string): Promise<Rating | undefined> {
	const [rating] = await sql<Rating[]>`
		select * from dealer_ratings
		where dealer_id = ${dealerId} and user_id = ${userId}`;

	if (!rating) {
		logger.warn(`Can't find rating for dealerId ${dealerId} and userId ${userId}`);
		return;
	}

	return rating;
}

export async function getAllDealerRatings(dealerId: string): Promise<Rating[]> {
	return await sql<Rating[]>`
		select *, a.username from dealer_ratings r
		join accounts a on a.id = user_id
		where dealer_id = ${dealerId}
		order by r.created desc`;
}

export async function saveDealerRating(rating: RatingUpsert) {
	await sql`insert into dealer_ratings ${sql(rating)} on conflict do nothing`;
}

export async function deleteDealerRating(userId: string, dealerId: string) {
	await sql`delete from dealer_ratings where user_id = ${userId} and dealer_id = ${dealerId}`;
}

export async function updateDealerRating(rating: RatingUpsert) {
	await sql`
		update dealer_ratings
		set ${sql(rating, "text", "stars")}
		where user_id = ${rating.userId} and dealer_id = ${rating.dealerId}`;
}

export async function isDealerFavorite(userId: string, dealerId: string): Promise<boolean> {
	const [result] = await sql`select true from favorite_dealers where user_id = ${userId} and dealer_id = ${dealerId}`;

	return !!result;
}

export async function toggleDealerFavorite(userId: string, dealerId: string): Promise<boolean> {
	const isFavorite = await isDealerFavorite(userId, dealerId);

	if (isFavorite) {
		await sql`delete from favorite_dealers where user_id = ${userId} and dealer_id = ${dealerId}`;
	} else {
		await sql`insert into favorite_dealers (user_id, dealer_id) values (${userId}, ${dealerId})`;
	}

	return !isFavorite;
}

export async function getDealHeadersByState(dealerId: string, state: string): Promise<DealHeader[]> {
	const view = `${state}_deals_view`;
	return await sql<DealHeader[]>`select * from ${sql(view)} where dealer_id = ${dealerId}`;
}

export async function getDealStatistics(dealId: string): Promise<DealStatistics | undefined> {
	const [result] = await sql<DealStatistics[]>`select * from statistics_view where deal_id=${dealId}`;

	return result;
}
