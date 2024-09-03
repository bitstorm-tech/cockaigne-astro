import { updateUseLocationService } from "@lib/services/account";
import logger from "@lib/services/logger";
import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request, locals }): Promise<Response> => {
	if (!locals.user.id) {
		logger.error(`Can't update useLocationService -> no account id`);
		return new Response();
	}

	const formData = await request.formData();
	const useLocationService = formData.get("use-location-service")?.toString() === "on";
	updateUseLocationService(locals.user.id, useLocationService);

	return new Response();
};
