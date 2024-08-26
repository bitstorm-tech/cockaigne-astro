import { prepareEmailChange } from "@lib/services/account";
import { renderAlertTranslated, renderInfoTranslated } from "@lib/services/alerts";
import { createBaseUrl } from "@lib/services/http";
import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ locals, request, url }): Promise<Response> => {
	const formData = await request.formData();
	const newEmail = formData.get("email")?.toString()?.trim();

	if (!newEmail?.length) {
		return renderAlertTranslated("alert.invalid_email", locals.user.language);
	}

	const baseUrl = createBaseUrl(url);
	const error = await prepareEmailChange(locals.user.id!, newEmail, baseUrl);
	if (error) {
		return renderAlertTranslated("alert.email_already_used", locals.user.language);
	}

	return renderInfoTranslated("info.send_activation_email", locals.user.language);
};
