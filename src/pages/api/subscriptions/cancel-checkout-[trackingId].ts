import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ params, locals, redirect }): Promise<Response> => {
	const trackingId = params.trackingId;

	return redirect("/pricing");
};
