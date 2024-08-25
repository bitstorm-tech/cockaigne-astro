import { preparePasswordChange } from "@lib/services/account";
import { renderInfoTranslated } from "@lib/services/alerts";
import { notForBasicUser } from "@lib/services/asserts";
import { createBaseUrl } from "@lib/services/http";
import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ locals, url }): Promise<Response> => {
	if (!locals.user.id) {
		return notForBasicUser("send-password-change-email");
	}

	const baseUrl = createBaseUrl(url);
	preparePasswordChange(locals.user.id, baseUrl);

	return renderInfoTranslated("info.send_change_pw_email", locals.user.language);
};
