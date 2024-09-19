import { preparePasswordChange } from "@lib/services/account";
import { renderAlertTranslated, renderInfoTranslated } from "@lib/services/alerts";
import { createBaseUrl } from "@lib/services/http";
import logger from "@lib/services/logger";
import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request, locals, url }): Promise<Response> => {
	const formData = await request.formData();
	const email = formData.get("email")?.toString().trim();

	if (!locals.user.id && !email) {
		return renderAlertTranslated("alert.provide_email", locals.language);
	}

	const baseUrl = createBaseUrl(url);
	const error = await preparePasswordChange(baseUrl, locals.user.id, email);
	if (error) {
		logger.error(error.stack);
		return renderAlertTranslated("alert.can_t_change_password", locals.language);
	}

	return renderInfoTranslated("info.send_change_pw_email", locals.language);
};
