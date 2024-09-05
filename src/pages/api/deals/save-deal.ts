import type { DealInsert } from "@lib/models/deal";
import { renderAlertTranslated } from "@lib/services/alerts";
import { calculateDurationInDays, saveDeal } from "@lib/services/deal";
import { redirect } from "@lib/services/http";
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

	const imageValue0 = formData.get("image0")?.valueOf();
	const imageValue1 = formData.get("image1")?.valueOf();
	const imageValue2 = formData.get("image2")?.valueOf();

	const image0 = imageValue0 ? (imageValue0 as File) : undefined;
	const image1 = imageValue1 ? (imageValue1 as File) : undefined;
	const image2 = imageValue2 ? (imageValue2 as File) : undefined;

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
		images: [image0, image1, image2],
	};
}
