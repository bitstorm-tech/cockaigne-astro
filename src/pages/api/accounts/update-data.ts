import type { AccountUpdate } from "@lib/models/account";
import { updateAccount } from "@lib/services/account";
import { renderAlertTranslated } from "@lib/services/alerts";
import { renderToastTranslated } from "@lib/services/toast";
import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ locals, request }): Promise<Response> => {
	if (!locals.user.id) {
		return renderAlertTranslated("alert.can_t_save_profile_image", locals.user.language);
	}

	const accountUpdate = await extractAccountDataFromRequest(request);
	const error = await updateAccount(locals.user.id, accountUpdate);
	if (error) {
		return renderAlertTranslated("alert.username_already_exists", locals.user.language);
	}

	return renderToastTranslated("info.changes_saved", locals.user.language);
};

async function extractAccountDataFromRequest(request: Request): Promise<AccountUpdate> {
	const formData = await request.formData();

	const username = formData.get("username")?.toString()?.trim();

	return {
		username,
	};
}
