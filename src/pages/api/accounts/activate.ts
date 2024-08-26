import { activateAccount } from "@lib/services/account";
import { renderAlertTranslated } from "@lib/services/alerts";
import { redirect } from "@lib/services/http";
import logger from "@lib/services/logger";
import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request, locals }): Promise<Response> => {
	const formData = await request.formData();
	const activationCode = formData.get("code")?.toString();

	if (!activationCode) {
		return renderAlertTranslated("alert.invalid_activation_code", locals.user.language);
	}

	const success = await activateAccount(activationCode);

	if (!success) {
		logger.warn(`Can't activate account with code ${activationCode}`);
		return renderAlertTranslated("alert.can_t_activate_account", locals.user.language);
	}

	return redirect("/login");
};
