import type { AddressUpdate } from "@lib/models/account";
import { updateAccount } from "@lib/services/account";
import { renderAlertTranslated } from "@lib/services/alerts";
import { renderToastTranslated } from "@lib/services/toast";
import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request, locals }): Promise<Response> => {
	if (!locals.user.id) {
		return renderAlertTranslated("alert.can_t_update_address", locals.user.language);
	}

	const update = await extractAddressDataFromRequest(request);
	await updateAccount(locals.user.id, update);

	return renderToastTranslated("info.changes_saved", locals.user.language);
};

async function extractAddressDataFromRequest(request: Request): Promise<AddressUpdate> {
	const formData = await request.formData();

	const street = formData.get("street")?.toString()?.trim();
	const houseNumber = formData.get("housenumber")?.toString().trim();
	const city = formData.get("city")?.toString().trim();
	const zip = Number(formData.get("zip")?.toString());

	return {
		street: street!,
		houseNumber: houseNumber!,
		city: city!,
		zip,
	};
}
