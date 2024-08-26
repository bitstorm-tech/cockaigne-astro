import type { FilterData } from "@lib/models/filter-data";
import sql from "@lib/services/pg";

export async function getFavoriteDealersCount(userId: string): Promise<number> {
	const result = await sql`select count(*) from favorite_dealers_view where user_id = ${userId}`;

	return result[0].count;
}

export async function getFavoriteDealsCount(userId: string): Promise<number> {
	const result = await sql`
	select count(*) from favorite_deals f
	join active_deals_view a on a.id = f.deal_id
  	where f.user_id = ${userId}`;

	return result[0].count;
}

export async function getFilterData(userId: string): Promise<FilterData> {
	const [result1, result2] = await Promise.all([
		await sql`select category_id from selected_categories where user_id = ${userId}`,
		await sql`select search_radius_in_meters from accounts where id = ${userId}`,
	]);

	return {
		selectedCategoryIds: result1.map((result) => result.categoryId),
		searchRadius: +result2[0].searchRadiusInMeters,
	};
}

export async function updateFilter(userId: string, categoryIds: number[], searchRadius?: number) {
	await sql`delete from selected_categories where user_id = ${userId}`;

	if (categoryIds.length > 0) {
		const insertCategoryIds = categoryIds.map((id) => ({ userId, categoryId: id }));
		await sql`insert into selected_categories ${sql(insertCategoryIds)} on conflict do nothing`;
	}

	if (searchRadius) {
		await sql`update accounts set search_radius_in_meters = ${searchRadius} where id = ${userId}`;
	}
}

export async function toggleFavorite(userId: string, dealId: string): Promise<boolean> {
	const [result] = await sql`select true from favorite_deals where deal_id = ${dealId} and user_id = ${userId} limit 1`;

	const isFavorite = !!result;
	if (isFavorite) {
		await sql`delete from favorite_deals where deal_id=${dealId} and user_id=${userId}`;
	} else {
		await sql`insert into favorite_deals (user_id, deal_id) values (${userId}, ${dealId})`;
	}

	return !isFavorite;
}
