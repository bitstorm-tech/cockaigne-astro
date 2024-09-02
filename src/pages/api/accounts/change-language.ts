import { changeLanguage } from "@lib/services/account";
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ url, locals }): Promise<Response> => {
	const lang = url.searchParams.get("lang") || "de";
	const headers = new Headers();
	headers.append("Set-Cookie", `lang=${lang}; HttpOnly; Path=/`);

	const response = new Response(null, { headers });
	response.headers.append("HX-Refresh", "true");

	if (locals.user.id) {
		changeLanguage(locals.user.id, lang);
	}

	return response;
};
