import type { Category } from "@lib/models/category";
import type { Deal } from "@lib/models/deal";
import type { DealDetails } from "@lib/models/deal-details";
import type { DealHeader } from "@lib/models/deal-header";
import type { Summary } from "@lib/models/deal-summary";
import sql from "@lib/services/pg";
import dayjs from "dayjs";
import { getFreeDaysLeft, getHighestVoucherDiscount, hasActiveSubscription } from "./dealer";
import { getDealImageUrls } from "./imagekit";
import logger from "./logger";

export type DealState = "active" | "past" | "future" | "template" | "favorite-deals" | "favorite-dealers";

export async function getAllCategories(): Promise<Category[]> {
	return await sql`select * from categories`;
}

export async function getCategory(id: number): Promise<Category | undefined> {
	const [result] = await sql<Category[]>`select * from categories where id = ${id}`;

	if (!result) {
		logger.warn(`Can't find category with ID ${id}`);
		return;
	}

	return result;
}

export async function getDealHeaders(state: DealState, userId?: string, dealerId?: string): Promise<DealHeader[]> {
	switch (state) {
		case "active":
			return getActiveDealHeaders(userId, dealerId);
		case "past":
			return [];
		case "future":
			return [];
		case "template":
			return [];
		case "favorite-deals":
			return getFavoriteDealsDealHeaders(userId!);
		case "favorite-dealers":
			return getFavoriteDealersDealHeaders(userId!);
	}
}

export async function getActiveDealHeaders(userId?: string, dealerId?: string): Promise<DealHeader[]> {
	const withDealerId = (dealerId: string | undefined) => (dealerId ? sql`where dealer_id = ${dealerId}` : sql``);

	return await sql<DealHeader[]>`
		select d.id, d.dealer_id, d.title, d.category_id, d.start, a.username, f.user_id = ${userId || sql`uuid_nil()`} as "isFavorite"
  		from active_deals_view d
		join accounts a on d.dealer_id = a.id
		left join favorite_deals f on f.deal_id = d.id
		${withDealerId(dealerId)}`;
}

export async function getFavoriteDealersDealHeaders(userId: string): Promise<DealHeader[]> {
	return await sql<DealHeader[]>`
		select d.id, d.dealer_id, d.title, d.category_id, d.start, d.username, f.user_id = ${userId || sql`uuid_nil()`} as "isFavorite"
	 	from active_deals_view d
		join favorite_dealers_view fd on fd.dealer_id = d.dealer_id
		left join favorite_deals f on f.deal_id = d.id
		where f.user_id = ${userId}`;
}

export async function getFavoriteDealsDealHeaders(userId: string): Promise<DealHeader[]> {
	return await sql<DealHeader[]>`
		select d.id, d.dealer_id, d.title, d.category_id, d.start, d.username, f.user_id = ${userId || sql`uuid_nil()`} as "isFavorite"
	 	from active_deals_view d
		left join favorite_deals f on f.deal_id = d.id
		where f.user_id = ${userId}`;
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
		title: result[0].title,
		description: result[0].description,
		imageUrls,
		start: startDate.format("DD.MM.YYYY"),
		end: startDate.add(result[0].durationInHours, "hours").format("DD.MM.YYYY"),
	};

	return dealDetails;
}

export async function getDeal(dealId: string): Promise<Deal | undefined> {
	const [result] = await sql<Deal[]>`select * from deals where id = ${dealId}`;

	if (!result) {
		logger.warn(`Can't find deal with ID ${dealId}`);
	}

	return result;
}

export async function incrementDealViewCount(dealId: string, userId: string) {
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
	const [result] = await sql`select true from likes where deal_id = ${dealId} and user_id = ${userId} limit 1`;

	return !!result;
}

export async function saveDealReport(userId: string, dealId: string, reportMessage: string) {
	await sql`insert into reported_deals (reporter_id, deal_id, reason)
				values (${userId}, ${dealId}, ${reportMessage})
				on conflict do nothing`;
}

export async function getDealReportMessage(userId: string, dealId: string): Promise<string> {
	const result = await sql`select reason from reported_deals where reporter_id = ${userId} and deal_id = ${dealId}`;

	if (result.length === 0) {
		return "";
	}

	return result[0].reason;
}

export async function getDealSummary(formData: FormData): Promise<Summary> {
	const startInstantly = formData.get("startInstantly")?.toString() === "on";
	const startDate = dayjs(startInstantly ? dayjs().toDate() : formData.get("startDate")?.toString());
	const duration = calculateDuration(formData);
	const dealerId = formData.get("dealerId")?.toString() || "";
	const price = await calculatePrice(dealerId, duration);

	return {
		start: startDate.toDate(),
		end: startDate.add(duration, "day").toDate(),
		duration,
		price: price.price,
		priceWithDiscount: price.priceWithDiscount,
		discount: price.discount,
		freeDaysLeft: price.freeDaysLeft,
		error: false,
	};
}

function calculateDuration(formData: FormData): number {
	const startInstantly = formData.get("startInstantly")?.toString() === "on";
	const ownEndDate = formData.get("ownEndDate")?.toString() === "on";
	const startDate = dayjs(startInstantly ? dayjs().toDate() : formData.get("startDate")?.toString());
	const endDate = dayjs(formData.get("endDate")?.toString());

	if (ownEndDate) {
		const startDateWithoutTime = dayjs(startDate.format("YYYY-MM-DD"));
		return endDate.diff(startDateWithoutTime, "day");
	}

	return Number(formData.get("duration")?.toString());
}

export async function calculatePrice(
	dealerId: string,
	duration: number,
): Promise<{ price: number; priceWithDiscount: number; discount: number; freeDaysLeft: number }> {
	const result = {
		price: 0,
		priceWithDiscount: 0,
		discount: 0,
		freeDaysLeft: 0,
	};

	const hasActiveSub = await hasActiveSubscription(dealerId);

	if (hasActiveSub) {
		const freeDaysLeft = (await getFreeDaysLeft(dealerId)) - duration;

		result.freeDaysLeft = Math.max(0, freeDaysLeft);

		if (freeDaysLeft < 0) {
			result.price = 499 * -freeDaysLeft;
		}

		return result;
	}

	result.discount = await getHighestVoucherDiscount(dealerId);

	return result;
}
