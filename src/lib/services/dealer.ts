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
