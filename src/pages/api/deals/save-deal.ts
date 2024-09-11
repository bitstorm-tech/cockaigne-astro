import type { DealInsert } from "@lib/models/deal";
import { renderAlertTranslated } from "@lib/services/alerts";
import { calculateDurationInDays, saveDeal } from "@lib/services/deal";
import { extractDealImagesFromFormData, redirect } from "@lib/services/http";
import { copyImageFromTemplate } from "@lib/services/imagekit";
import logger from "@lib/services/logger";
import type { APIRoute } from "astro";
import dayjs from "dayjs";

export const POST: APIRoute = async ({ request, url, locals }): Promise<Response> => {
	if (!locals.user.id) {
		logger.error(`Can't save deal -> missing dealer ID`);
		return renderAlertTranslated("alert.can_t_save_deal", locals.user.language);
	}

	const formData = await request.formData();
	const dealInsert = extractDealFromRequest(locals.user.id, formData);
	const dealId = await saveDeal(dealInsert);

	const templateId = url.searchParams.get("from-template");
	if (templateId) {
		for (let i = 0; i < dealInsert.images.length; i++) {
			if (!dealInsert.images[i] && formData.get(`deleteImage${i}`)?.toString() !== "on") {
				logger.debug(`Copy deal image ${i} from template ${templateId}`);
				await copyImageFromTemplate(templateId, dealId, i);
			}
		}
	}

	return redirect("/");
};

function extractDealFromRequest(dealerId: string, formData: FormData): DealInsert {
	const durationInHours = calculateDurationInDays(formData) * 24;

	const startInstantly = formData.get("startInstantly")?.toString() === "on";
	const start = startInstantly ? dayjs().toDate() : dayjs(formData.get("startDate")?.toString()).toDate();

	return {
		dealerId,
		title: formData.get("title")?.toString() || "",
		description: formData.get("description")?.toString() || "",
		categoryId: Number(formData.get("category")?.toString()),
		startInstantly,
		ownEndDate: formData.get("ownEndDate")?.toString() === "on",
		start,
		template: formData.get("template")?.toString() === "on",
		durationInHours,
		images: extractDealImagesFromFormData(formData),
	};
}
