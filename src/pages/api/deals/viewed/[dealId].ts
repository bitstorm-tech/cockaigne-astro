import { incrementDealViewCount } from "@lib/services/deal";
import logger from "@lib/services/logger";
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ params, locals }): Promise<Response> => {
	if (!params.dealId) {
		logger.warn(`Can't toggle like -> invalid deal ID: ${params.dealId}`);
		return new Response();
	}

	if (!locals.user.id) {
		logger.warn(`Can't toggle like -> invalid user ID: ${locals.user.id}`);
		return new Response();
	}

	incrementDealViewCount(params.dealId, locals.user.id);

	return new Response();
};
