import type { DealUpdate } from "@lib/models/deal";
import { renderAlertTranslated } from "@lib/services/alerts";
import { calculateDurationInDays, updateDeal } from "@lib/services/deal";
import { extractDealImagesFromFormData } from "@lib/services/http";
import logger from "@lib/services/logger";
import { renderToastTranslated } from "@lib/services/toast";
import type { APIRoute } from "astro";
import dayjs from "dayjs";

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

	const durationInDays = calculateDurationInDays(formData);

	const dealUpdate: DealUpdate = {
		id: formData.get("dealId")?.toString() || "",
		title,
		description,
		start: dayjs(formData.get("startDate")?.toString()).toDate(),
		durationInHours: durationInDays * 24,
		categoryId: Number(formData.get("category")?.toString()),
		ownEndDate: formData.get("ownEndDate")?.toString() === "on",
		startInstantly: formData.get("startInstantly")?.toString() === "on",
		deleteImages: [
			formData.get("deleteImage0")?.toString() === "on",
			formData.get("deleteImage1")?.toString() === "on",
			formData.get("deleteImage2")?.toString() === "on",
		],
		newImages: extractDealImagesFromFormData(formData),
	};

	await updateDeal(dealUpdate);

	return renderToastTranslated("toast.changes_saved_successfully", locals.user.language);
};
