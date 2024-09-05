import type { DealUpdate } from "@lib/models/deal";
import { renderAlertTranslated } from "@lib/services/alerts";
import { updateDeal } from "@lib/services/deal";
import { extractDealImagesFromFormData, redirect } from "@lib/services/http";
import logger from "@lib/services/logger";
import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request, locals }): Promise<Response> => {
	if (!locals.user.id) {
		logger.error(`Can't update deal -> missing dealer ID`);
		return new Response();
	}

	const formData = await request.formData();
	const title = formData.get("title")?.toString();
	if (!title) {
		return renderAlertTranslated("alert.enter_title", locals.user.language);
	}

	const description = formData.get("description")?.toString();

	if (!description) {
		return renderAlertTranslated("alert.enter_description", locals.user.language);
	}

	const dealUpdate = {
		id: formData.get("dealId")?.toString(),
		title,
		description,
		categoryId: Number(formData.get("category")?.toString()),
		deleteImages: [
			formData.get("deleteImage0")?.toString() === "on",
			formData.get("deleteImage1")?.toString() === "on",
			formData.get("deleteImage2")?.toString() === "on",
		],
		newImages: extractDealImagesFromFormData(formData),
	} as DealUpdate;

	await updateDeal(dealUpdate);

	return redirect("/");
};
