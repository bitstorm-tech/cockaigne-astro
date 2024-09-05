import type { DealInsert } from "@lib/models/deal";
import { renderAlertTranslated } from "@lib/services/alerts";
import { calculateDurationInDays, saveDeal } from "@lib/services/deal";
import { extractDealImagesFromFormData, redirect } from "@lib/services/http";
import logger from "@lib/services/logger";
import type { APIRoute } from "astro";
import dayjs from "dayjs";

export const POST: APIRoute = async ({ request, locals }): Promise<Response> => {
	if (!locals.user.id) {
		logger.error(`Can't save deal -> missing dealer ID`);
		return renderAlertTranslated("", locals.user.language);
	}

	const formData = await request.formData();
	const dealInsert = extractDealFromRequest(locals.user.id, formData);
	const error = await saveDeal(dealInsert);

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
