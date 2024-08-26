import type { Account } from "@lib/models/account";
import { accountExists, insertAccount } from "@lib/services/account";
import { renderAlertTranslated } from "@lib/services/alerts";
import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request, locals }): Promise<Response> => {
	const formData = await request.formData();
	const account = extractAccountFromForm(formData);
	account.language = locals.user.language ? locals.user.language : account.language;

	const accExists = await accountExists(account.email, account.username);
	if (accExists) {
		return renderAlertTranslated("alert.username_or_email_already_used", account.language);
	}

	if (account.password !== formData.get("passwordRepeat")) {
		return renderAlertTranslated("alert.password_repeat_not_matching", account.language);
	}

	const errorResponse = checkAccount(account);

	if (errorResponse) {
		return errorResponse;
	}

	const termsAccepted = formData.get("terms")?.toString() === "on";
	if (!termsAccepted) {
		return renderAlertTranslated("alert.accept_terms_and_privacy", account.language);
	}

	const error = await insertAccount(account);
	if (error) {
		return renderAlertTranslated("alert.can_t_create_account", account.language);
	}

	return new Response();
};

function extractAccountFromForm(formData: FormData): Account {
	return {
		id: "",
		username: formData.get("username")?.toString()?.trim() || "",
		email: formData.get("email")?.toString()?.trim() || "",
		language: "de",
		age: Number(formData.get("age")?.toString()?.trim() || -1),
		gender: formData.get("gender")?.toString()?.trim() || "",
		password: formData.get("password")?.toString()?.trim() || "",
		isDealer: formData.get("isDealer")?.toString()?.trim() === "on",
		street: formData.get("street")?.toString()?.trim() || "",
		houseNumber: formData.get("houseNumber")?.toString()?.trim() || "",
		city: formData.get("city")?.toString()?.trim() || "",
		zip: Number(formData.get("zip")?.toString()?.trim()),
		phone: formData.get("phone")?.toString()?.trim() || "",
		taxId: formData.get("taxId")?.toString()?.trim() || "",
		useLocationService: false,
		searchRadiusInMeter: 1000,
		location: "",
		active: false,
	};
}

function checkAccount(account: Account): Response | undefined {
	if (!account.username.length) return renderAlertTranslated("alert.provide_username", account.language);
	if (!account.email.length) return renderAlertTranslated("alert.provide_email", account.language);
	if (!account.password.length) return renderAlertTranslated("alert.provide_password", account.language);

	if (account.isDealer) {
		if (!account.street?.length) return renderAlertTranslated("alert.provide_street", account.language);
		if (!account.houseNumber?.length) return renderAlertTranslated("alert.provide_house_number", account.language);
		if (!account.city?.length) return renderAlertTranslated("alert.provide_city", account.language);
		if (Number.isNaN(account.zip)) return renderAlertTranslated("alert.provide_zip", account.language);
		if (!account.phone?.length) return renderAlertTranslated("alert.provide_phone", account.language);
		if (!account.taxId?.length) return renderAlertTranslated("alert.provide_tax_id", account.language);
	}
}
