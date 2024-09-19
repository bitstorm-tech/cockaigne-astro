import { renderAlertTranslated } from "@lib/services/alerts";
import { createBaseUrl } from "@lib/services/http";
import logger from "@lib/services/logger";
import { createSubscription } from "@lib/services/subscription";
import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ params, locals, url }): Promise<Response> => {
	const planId = params.planId;

	if (!planId) {
		logger.error(`Invalid plan ID: ${planId}`);
		return renderAlertTranslated("alert.can_t_conclude_subscription", locals.language);
	}

	const baseUrl = createBaseUrl(url);
	const redirection = await createSubscription(locals.user.id || "", planId, baseUrl);

	const response = new Response();
	response.headers.append("HX-Redirect", redirection);

	return response;
};
