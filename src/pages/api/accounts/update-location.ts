import { updateLocation } from "@lib/services/account";
import { AstroService } from "@lib/services/astro";
import { encryptJwt } from "@lib/services/auth";
import { Point } from "@lib/services/geo";
import { HttpService } from "@lib/services/http";
import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request, locals }): Promise<Response> => {
	const formData = await request.formData();
	const lon = Number(formData.get("lon")?.toString());
	const lat = Number(formData.get("lat")?.toString());
	const point = new Point(lon, lat);

	const { id, basicUser } = AstroService.extractIdAndBasicUserFromLocals(locals);

	if (id) {
		updateLocation(id, point);
		return new Response();
	}

	basicUser.location = point;
	const basicUserPayload = await encryptJwt(basicUser);
	return HttpService.createSetCookieResponse("basicUser", basicUserPayload);
};
