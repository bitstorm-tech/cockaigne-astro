import { renderAlertTranslated } from "@lib/services/alerts";
import { saveDealReport } from "@lib/services/deal";
import logger from "@lib/services/logger";
import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ params, locals, request }): Promise<Response> => {
	const dealId = params.dealId;

	if (!locals.user.id) {
		logger.warn(`Can't save deal report -> invalid user ID: ${locals.user.id}`);
		return renderAlertTranslated("alert.can_t_report_deal", locals.language);
	}

	if (!dealId) {
		logger.warn(`Can't save deal report -> invalid deal ID: ${dealId}`);
		return renderAlertTranslated("alert.can_t_report_deal", locals.language);
	}

	const formData = await request.formData();
	const reason = formData.get("reason")?.toString();

	if (!reason?.length) {
		logger.warn("Can't create reason without message");
		return renderAlertTranslated("alert.report_cause", locals.language);
	}

	saveDealReport(locals.user.id, dealId, reason);

	return new Response();
};
