import type { DealerAccountUpdate, UserAccountUpdate } from "@lib/models/account";
import { updateAccount } from "@lib/services/account";
import { renderAlertTranslated } from "@lib/services/alerts";
import { renderToastTranslated } from "@lib/services/toast";
import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ locals, request }): Promise<Response> => {
	if (!locals.user.id) {
		return renderAlertTranslated("alert.can_t_save_profile_image", locals.user.language);
	}

	const accountUpdate = await extractAccountDataFromRequest(request, locals.user.isDealer);
	const error = await updateAccount(locals.user.id, accountUpdate);
	if (error) {
		return renderAlertTranslated("alert.username_already_exists", locals.user.language);
	}

	return renderToastTranslated("info.changes_saved", locals.user.language);
};

async function extractAccountDataFromRequest(
	request: Request,
	isDealer: boolean,
): Promise<UserAccountUpdate | DealerAccountUpdate> {
	const formData = await request.formData();

	const username = formData.get("username")?.toString()?.trim();
	const phone = formData.get("phone")?.toString().trim();
	const taxId = formData.get("tax-id")?.toString().trim();
	const defaultCategory = Number(formData.get("category")?.toString());

	return isDealer
		? {
				username,
				phone,
				taxId,
				defaultCategory,
			}
		: { username };
}
