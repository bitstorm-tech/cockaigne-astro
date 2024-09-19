import { AstroService } from "@lib/services/astro";
import { encryptJwt } from "@lib/services/auth";
import { refresh } from "@lib/services/http";
import logger from "@lib/services/logger";
import { updateFilter } from "@lib/services/user";
import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request, locals }): Promise<Response> => {
	const { id, basicUser } = AstroService.extractIdAndBasicUserFromLocals(locals);
	const formData = await request.formData();
	const selectedCategoryIds =
		formData
			.getAll("selectedCategoryIds")
			.map((id) => +id)
			.filter((id) => !isNaN(id)) || [];
	const searchRadiusFormValue = formData.get("searchRadius");
	const searchRadius = searchRadiusFormValue ? +searchRadiusFormValue : undefined;

	logger.debug(
		`Update filter for user ${id}: selectedCategories: ${selectedCategoryIds}, searchRadius: ${searchRadius}`,
	);

	if (id) {
		updateFilter(id, selectedCategoryIds, searchRadius);
		return refresh();
	} else {
		basicUser.selectedCategories = selectedCategoryIds;
		basicUser.searchRadius = searchRadius || basicUser.searchRadius;
		const basicUserPayload = await encryptJwt(basicUser);
		return refresh({ key: "basicUser", value: basicUserPayload });
	}
};
