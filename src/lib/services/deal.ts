import type { Category } from "@lib/models/category";
import type { Deal, DealDetails, DealHeader, DealInsert, DealOnMap, DealUpdate } from "@lib/models/deal";
import type { Summary } from "@lib/models/deal-summary";
import sql from "@lib/services/pg";
import dayjs from "dayjs";
import { Point, type Extent } from "./geo";
import { deleteDealImage, getDealImageUrls, saveDealImage } from "./imagekit";
import logger from "./logger";
import {
	getFreeDaysLeftInCurrentSubscriptionPeriod,
	getHighestVoucherDiscount,
	hasActiveSubscription,
} from "./subscription";
import type { IdOrBasicUser } from "./user";

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

export async function getTopDeals(type: "likes" | "favorites"): Promise<DealHeader[]> {
	return await sql<DealHeader[]>`
		select id, dealer_id, title, category_id, username
		from top_deals_view
		order by ${type}
		limit 10`;
}

// TODO: move colors to database
const dealColorMap = new Map<number, string>([
	[1, "#6898af"], //Elektronik & Technik
	[2, "#4774b2"], //Unterhaltung & Gaming
	[3, "#86b200"], //Lebensmittel & Haushalt
	[4, "#b3396a"], //Fashion, Schmuck & Lifestyle
	[5, "#9059b3"], //Beauty, Wellness & Gesundheit
	[6, "#02b0b2"], //Family & Kids
	[7, "#b2aba0"], //Home & Living
	[8, "#b28d4b"], //Baumarkt & Garten
	[9, "#5c5e66"], //Auto, Fahhrad & Motorrad
	[10, "#b35a37"], //Gastronomie, Bars & Cafes
	[11, "#b3b100"], //Kultur & Freizeit
	[12, "#b22929"], //Sport & Outdoor
	[13, "#3d484b"], //Reisen, Hotels & Übernachtungen
	[14, "#465c8e"], //Dienstleistungen & Finanzen
	[15, "#60b262"], //Floristik
	[16, "#b3b3b3"], //Sonstiges
]);

export async function getDealsForMap(extent: Extent, idOrBasicUser: IdOrBasicUser): Promise<DealOnMap[]> {
	const { id, basicUser } = idOrBasicUser;
	const selectedCategoriesCondition = id
		? sql`join selected_categories s on a.category_id = s.category_id and s.user_id = ${id}`
		: sql``;

	const additionalWhereCondition =
		id || basicUser.selectedCategories.length === 0
			? sql``
			: sql`and a.category_id in ${sql(basicUser.selectedCategories)}`;

	const result = await sql<{ wkt: string; categoryId: number }[]>`
		select st_astext(a.location) as wkt, a.category_id
		from active_deals_view a
		${selectedCategoriesCondition}
		where
			st_within(location, st_makeenvelope(${extent.a}, ${extent.b}, ${extent.c}, ${extent.d}, 4326))
			${additionalWhereCondition}`;

	return result.map((deal) => ({
		location: Point.fromWkt(deal.wkt),
		color: dealColorMap.get(deal.categoryId) || "#ff00ff",
	}));
}

function rotateToCurrentDeal(dealHeaders: DealHeader[]): DealHeader[] {
	if (dealHeaders.length <= 1) {
		return dealHeaders;
	}

	const now = Number(dayjs().format("HHmmss"));

	for (let i = 0; i < dealHeaders.length; i++) {
		const nextStartTime = Number(dealHeaders[1].startTime.split(".")[0].replaceAll(":", ""));
		if (nextStartTime < now) {
			dealHeaders.push(dealHeaders.shift()!);
		} else {
			break;
		}
	}

	return dealHeaders;
}

export async function getActiveDealHeadersForUserPage(idOrBasicUser: IdOrBasicUser): Promise<DealHeader[]> {
	const { id, basicUser } = idOrBasicUser;

	let categoryIds = basicUser.selectedCategories;

	if (id) {
		const [result] =
			await sql`select array_agg(category_id) as category_ids from selected_categories where user_id = ${id}`;

		categoryIds = result.categoryIds;
	}

	const categoryFilter = categoryIds?.length > 0 ? sql` and d.category_id in ${sql(categoryIds)}` : sql``;
	const spatialFilter = id
		? sql`st_within(d.location, st_buffer(a.location::geography, a.search_radius_in_meters)::geometry)`
		: sql`st_within(d.location, st_buffer(${basicUser.location.toWkt()}::geography, ${basicUser.searchRadius})::geometry)`;
	const joinAccountsCondition = id ? sql`join accounts a on a.id = ${id}` : sql``;

	return rotateToCurrentDeal(
		await sql<DealHeader[]>`
		select d.id, d.dealer_id, d.title, d.category_id, d.username, d.start_time, f.user_id = ${id || sql`uuid_nil()`} as "isFavorite"
  		from active_deals_view d
    	${joinAccountsCondition}
		left join favorite_deals f on f.deal_id = d.id
		where
			${spatialFilter}
			${categoryFilter}
		order by d.start_time`,
	);
}

export async function getActiveDealHeadersForDealerPage(dealerId: string, userId?: string): Promise<DealHeader[]> {
	return await sql<DealHeader[]>`
		select d.id, d.dealer_id, d.title, d.category_id, d.username, f.user_id = ${userId || sql`uuid_nil()`} as "isFavorite"
  		from active_deals_view d
		left join favorite_deals f on f.deal_id = d.id
		where dealer_id = ${dealerId}`;
}

export async function getFavoriteDealersDealHeaders(userId: string): Promise<DealHeader[]> {
	return rotateToCurrentDeal(
		await sql<DealHeader[]>`
		select d.id, d.dealer_id, d.title, d.category_id, d.username, d.start_time, f.user_id = ${userId || sql`uuid_nil()`} as "isFavorite"
	 	from active_deals_view d
		join favorite_dealers_view fd on fd.dealer_id = d.dealer_id
		left join favorite_deals f on f.deal_id = d.id
		where f.user_id = ${userId}
		order by d.start_time`,
	);
}

export async function getFavoriteDealsDealHeaders(userId: string): Promise<DealHeader[]> {
	return rotateToCurrentDeal(
		await sql<DealHeader[]>`
		select d.id, d.dealer_id, d.title, d.category_id, d.username, d.start_time, f.user_id = ${userId || sql`uuid_nil()`} as "isFavorite"
	 	from active_deals_view d
		left join favorite_deals f on f.deal_id = d.id
		where f.user_id = ${userId}`,
	);
}

export async function getTemplateDealHeaders(dealerId: string): Promise<DealHeader[]> {
	return await sql<DealHeader[]>`
		select id, dealer_id, title, category_id from deals where dealer_id = ${dealerId} and template is true`;
}

export async function getDealDetails(dealId: string): Promise<DealDetails | undefined> {
	const [result] =
		await sql`select title, description, start, duration_in_hours, dealer_id from deals where id = ${dealId}`;

	if (!result) {
		logger.error(`Can't find deal details for ID ${dealId}`);
		return;
	}

	const startDate = dayjs(result.start);
	const imageUrls = await getDealImageUrls(dealId, 400);

	return {
		dealerId: result.dealerId,
		title: result.title,
		description: result.description,
		imageUrls,
		start: startDate.format("DD.MM.YYYY"),
		end: startDate.add(result.durationInHours, "hours").format("DD.MM.YYYY"),
	};
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
	const duration = calculateDurationInDays(formData);
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

export function calculateDurationInDays(formData: FormData): number {
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
		const freeDaysLeft = (await getFreeDaysLeftInCurrentSubscriptionPeriod(dealerId)) - duration;

		result.freeDaysLeft = Math.max(0, freeDaysLeft);

		if (freeDaysLeft < 0) {
			result.price = 499 * -freeDaysLeft;
		}

		return result;
	}

	result.discount = await getHighestVoucherDiscount(dealerId);

	return result;
}

export async function saveDeal(dealInsert: DealInsert): Promise<string> {
	const { images, ...rest } = dealInsert;

	rest.paymentState = "PAYMENT_PENDING";

	const [result] = await sql`insert into deals ${sql(rest)} returning id`;

	images.forEach(async (image, index) => {
		if (image) {
			await saveDealImage(result.id, index, image);
		}
	});

	return result.id;
}

export async function updateDeal(dealUpdate: DealUpdate) {
	const { id, deleteImages, newImages, ...dealData } = dealUpdate;

	await sql`update deals set ${sql(dealData)} where id = ${id}`;

	for (let i = 0; i < 3; i++) {
		if (deleteImages[i]) {
			await deleteDealImage(id, i);
		}
	}

	for (let i = 0; i < 3; i++) {
		const image = newImages[i];

		if (image) {
			await saveDealImage(id, i, image);
		}
	}
}

export async function activateDealByDealId(dealId: string) {
	await sql`update deals set payment_state = 'PAYED' where id = ${dealId}`;
}

export async function activateDealByStripePaymentIntentId(paymentIntentId: string) {
	await sql`update deals set payment_state = 'PAYED' where stripe_payment_intent_id = ${paymentIntentId}`;
}

export async function setPaymentIntentId(dealId: string, paymentIntentId: string) {
	await sql`update deals set stripe_payment_intent_id = ${paymentIntentId} where id = ${dealId}`;
}
