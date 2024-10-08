import { changeEmail } from "@lib/services/account";
import { renderAlertTranslated, renderInfoTranslated } from "@lib/services/alerts";
import logger from "@lib/services/logger";
import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request, locals }): Promise<Response> => {
	const formData = await request.formData();
	const oldMail = formData.get("email")?.toString()?.trim() || "";
	const code = formData.get("code")?.toString() || "";

	const error = await changeEmail(oldMail, code);
	if (error) {
		logger.error(error.stack);
		return renderAlertTranslated("alert.can_t_change_email", locals.language);
	}

	return renderInfoTranslated("info.email_changed", locals.language);
};
