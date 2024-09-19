import { updateUseLocationService } from "@lib/services/account";
import { AstroService } from "@lib/services/astro";
import { encryptJwt } from "@lib/services/auth";
import { HttpService } from "@lib/services/http";
import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request, locals }): Promise<Response> => {
	const { id, basicUser } = AstroService.extractIdAndBasicUserFromLocals(locals);
	const formData = await request.formData();
	const useLocationService = formData.get("use-location-service")?.toString() === "on";

	if (id) {
		updateUseLocationService(id, useLocationService);
		return new Response();
	}

	basicUser.useLocationService = useLocationService;
	const basicUserPayload = await encryptJwt(basicUser);
	return HttpService.createSetCookieResponse("basicUser", basicUserPayload);
};
