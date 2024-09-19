import { changePassword } from "@lib/services/account";
import { renderAlertTranslated, renderInfoTranslated } from "@lib/services/alerts";
import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request, locals }): Promise<Response> => {
	const formData = await request.formData();
	const code = formData.get("code")?.toString() || "";
	const newPassword = formData.get("password")?.toString() || "";
	const newPasswordRepeat = formData.get("password-repeat")?.toString() || "";

	if (newPassword !== newPasswordRepeat) {
		return renderAlertTranslated("alert.password_repeat_not_matching", locals.language);
	}

	if (newPassword.length === 0) {
		return renderAlertTranslated("alert.can_t_change_password", locals.language);
	}

	const error = await changePassword(newPassword, code);
	if (error) {
		return renderAlertTranslated("alert.can_t_change_password", locals.language);
	}

	return renderInfoTranslated("info.password_changed", locals.language);
};
