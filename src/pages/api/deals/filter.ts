import { AstroService } from "@lib/services/astro";
import { getDealsForMap } from "@lib/services/deal";
import { Extent } from "@lib/services/geo";
import logger from "@lib/services/logger";
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ url, locals }): Promise<Response> => {
	const extentString = url.searchParams.get("extent");

	if (!extentString) {
		logger.error(`Can't get deals for map -> missing extent`);
		return new Response("[]");
	}

	const extent = Extent.fromString(extentString);
	if (!extent) {
		return new Response("[]");
	}

	const idOrBasicUser = AstroService.extractIdAndBasicUserFromLocals(locals);
	const deals = await getDealsForMap(extent, idOrBasicUser);

	return new Response(JSON.stringify(deals));
};
