import { updateLocation } from "@lib/services/account";
import { Point } from "@lib/services/geo";
import logger from "@lib/services/logger";
import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request, locals }): Promise<Response> => {
	if (!locals.user.id) {
		logger.error("Can't update account location -> missing account id");
		return new Response();
	}

	const formData = await request.formData();
	const lon = Number(formData.get("lon")?.toString());
	const lat = Number(formData.get("lat")?.toString());
	const point = new Point(lon, lat);

	updateLocation(locals.user.id, point);

	return new Response();
};
