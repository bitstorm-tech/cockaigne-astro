import type { Account } from "@lib/models/account";
import { accountExists, insertAccount } from "@lib/services/account";
import { renderAlertTranslated } from "@lib/services/alerts";
import { sendActivationEmail } from "@lib/services/brevo";
import { getLocationFromAddress, Point } from "@lib/services/geo";
import { createBaseUrl, redirect } from "@lib/services/http";
import logger from "@lib/services/logger";
import type { APIRoute } from "astro";
import { None, Some, type Option } from "ts-results-es";

export const POST: APIRoute = async ({ request, locals, url }): Promise<Response> => {
	const formData = await request.formData();
	const account = extractAccountFromForm(formData);
	account.language = locals.user.language ? locals.user.language : account.language;

	const failedCheck = await checkRegistration(account, formData);
	if (failedCheck.isSome()) {
		return failedCheck.value;
	}

	if (account.isDealer) {
		const location = await getLocationFromAddress(account.street!, account.houseNumber!, account.city!, account.zip!);
		if (location.isNone()) {
			return renderAlertTranslated("alert.invalid_address", account.language);
		}

		account.location = location.value;
	}

	const result = await insertAccount(account);
	if (result.isErr()) {
		logger.error(result.stack);
		return renderAlertTranslated("alert.can_t_create_account", account.language);
	}

	const baseUrl = createBaseUrl(url);
	sendActivationEmail(account.email, account.activationCode!, baseUrl);

	return redirect("/registration-complete");
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
		zip: Number(formData.get("zipCode")?.toString()?.trim()),
		phone: formData.get("phone")?.toString()?.trim() || "",
		taxId: formData.get("taxId")?.toString()?.trim() || "",
		defaultCategory: Number(formData.get("category")?.toString()?.trim()),
		useLocationService: false,
		searchRadiusInMeter: 1000,
		location: Point.centerOfGermany(),
		active: false,
	};
}

function checkAccount(account: Account): Option<Response> {
	if (!account.username.length) return Some(renderAlertTranslated("alert.provide_username", account.language));
	if (!account.email.length) return Some(renderAlertTranslated("alert.provide_email", account.language));
	if (!account.password.length) return Some(renderAlertTranslated("alert.provide_password", account.language));

	if (account.isDealer) {
		if (Number.isNaN(account.defaultCategory) || account.defaultCategory === -1)
			return Some(renderAlertTranslated("alert.provide_category", account.language));
		if (!account.street?.length) return Some(renderAlertTranslated("alert.provide_street", account.language));
		if (!account.houseNumber?.length)
			return Some(renderAlertTranslated("alert.provide_house_number", account.language));
		if (!account.city?.length) return Some(renderAlertTranslated("alert.provide_city", account.language));
		if (Number.isNaN(account.zip)) return Some(renderAlertTranslated("alert.provide_zip", account.language));
		if (!account.phone?.length) return Some(renderAlertTranslated("alert.provide_phone", account.language));
		if (!account.taxId?.length) return Some(renderAlertTranslated("alert.provide_tax_id", account.language));
	}

	return None;
}

async function checkRegistration(account: Account, formData: FormData): Promise<Option<Response>> {
	const accExists = await accountExists(account.email, account.username);
	if (accExists) {
		return Some(renderAlertTranslated("alert.username_or_email_already_used", account.language));
	}

	if (account.password !== formData.get("passwordRepeat")) {
		return Some(renderAlertTranslated("alert.password_repeat_not_matching", account.language));
	}

	const failedCheck = checkAccount(account);
	if (failedCheck.isSome()) {
		return failedCheck;
	}

	const termsAccepted = formData.get("terms")?.toString() === "on";
	if (!termsAccepted) {
		return Some(renderAlertTranslated("alert.accept_terms_and_privacy", account.language));
	}

	return None;
}
