import { removePendingCheckout } from "@lib/services/subscription";
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ params, redirect }): Promise<Response> => {
	const trackingId = params.trackingId || "";

	removePendingCheckout(trackingId);

	return redirect("/pricing");
};
