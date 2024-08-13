import logger from "@lib/services/logger";
import { updateFilter } from "@lib/services/user";
import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request, locals }): Promise<Response> => {
	const userId = locals.user.id;
	if (!userId) {
		return new Response();
	}

	const formData = await request.formData();
	const selectedCategoryIds =
		formData
			.getAll("selectedCategoryIds")
			.map((id) => +id)
			.filter((id) => !isNaN(id)) || [];
	const searchRadiusFormValue = formData.get("searchRadius");
	const searchRadius = searchRadiusFormValue ? +searchRadiusFormValue : undefined;

	logger.debug(
		`Update filter for user ${userId}: selectedCategories: ${selectedCategoryIds}, searchRadius: ${searchRadius}`,
	);

	updateFilter(userId, selectedCategoryIds, searchRadius);

	return new Response();
};
