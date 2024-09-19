import type { FilterModalFilterData } from "@lib/models/filter-data";
import type { BasicUser } from "@lib/models/user";
import sql from "@lib/services/pg";
import { Point } from "./geo";
import logger from "./logger";

export type IdOrBasicUser = { id?: string; basicUser: BasicUser };

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

export async function getFilterModalFilterData(userId: string): Promise<FilterModalFilterData> {
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

export async function areSelectedCategoriesActive(userId: string): Promise<boolean> {
	const [result] = await sql`select true from selected_categories where user_id = ${userId}`;

	return !!result;
}

export async function useLocationService(userId: string): Promise<boolean> {
	const [result] = await sql`select use_location_service from accounts where id = ${userId}`;

	return result.useLocationService;
}

export interface FilterData {
	location: Point;
	useLocationService: boolean;
	searchRadius: number;
}

export namespace UserService {
	export async function getFilterData(idOrBasicUser: IdOrBasicUser): Promise<FilterData> {
		const { id, basicUser } = idOrBasicUser;
		if (!id) {
			return {
				location: basicUser.location,
				useLocationService: basicUser.useLocationService,
				searchRadius: basicUser.searchRadius,
			};
		}

		const [result] =
			await sql`select st_astext(location) as location, use_location_service, search_radius_in_meters from accounts where id = ${id}`;

		return {
			location: Point.fromWkt(result.location),
			useLocationService: result.useLocationService,
			searchRadius: result.searchRadiusInMeters,
		};
	}

	export async function useLocationService(userId: string): Promise<boolean> {
		const [result] = await sql`select use_location_service from accounts where id = ${userId}`;

		if (!result) {
			logger.error(`Can't check if user ${userId} is using location service`);
			return false;
		}

		return result.useLocationService;
	}
}
