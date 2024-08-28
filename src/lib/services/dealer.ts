import type { Rating } from "@lib/models/rating";
import logger from "./logger";
import sql from "./pg";

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
