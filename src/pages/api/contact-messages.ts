import { renderAlertTranslated, renderInfoTranslated } from "@lib/services/alerts";
import { isLastContactMessageYoungerThenFiveMinutes, saveContactMessage } from "@lib/services/contact-messages";
import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request, locals }): Promise<Response> => {
	const { language, id = "" } = locals.user;
	const lastMessageYoungerThenFiveMinutes = await isLastContactMessageYoungerThenFiveMinutes(id);

	if (lastMessageYoungerThenFiveMinutes) {
		return renderAlertTranslated("alert.message_delay", language);
	}

	const formData = await request.formData();
	const message = formData.get("message")?.toString();

	if (!message) {
		return renderAlertTranslated("alert.can_t_save_message", language);
	}

	saveContactMessage(id, message);

	return renderInfoTranslated("info.contact_message_send", language);
};