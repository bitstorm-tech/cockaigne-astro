import { renderAlertTranslated } from "@lib/services/alerts";
import { deleteProfileImage, saveProfileImage } from "@lib/services/imagekit";
import logger from "@lib/services/logger";
import { renderToastTranslated } from "@lib/services/toast";
import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ locals, request }): Promise<Response> => {
	if (!locals.user.id) {
		return renderAlertTranslated("alert.can_t_save_profile_image", locals.user.language);
	}

	const formData = await request.formData();
	const deleteImage = formData.get("delete-image") === "true";

	if (deleteImage) {
		const error = await deleteProfileImage(locals.user.id);
		if (error) {
			logger.warn(error);
			return renderAlertTranslated("alert.can_t_delet_profile_image", locals.user.language);
		}
	} else {
		const image = formData.get("profile-image")?.valueOf();
		if (!image) {
			return renderAlertTranslated("alert.can_t_save_profile_image", locals.user.language);
		}
		saveProfileImage(locals.user.id, image.valueOf() as File);
	}

	return renderToastTranslated("info.profile_image_changed", locals.user.language);
};
