import { SendSmtpEmail, TransactionalEmailsApi, TransactionalEmailsApiApiKeys } from "@getbrevo/brevo";
import logger from "./logger";

const changeEmailTemplateId = +import.meta.env.BREVO_CHANGE_EMAIL_TEMPLATE_ID;
const changePasswordTemplateId = +import.meta.env.BREVO_CHANGE_PASSWORD_TEMPLATE_ID;
const activateAccountTemplateId = +import.meta.env.BREVO_ACTIVATE_ACCOUNT_TEMPLATE_ID;
const brevoApi = new TransactionalEmailsApi();
brevoApi.setApiKey(TransactionalEmailsApiApiKeys.apiKey, import.meta.env.BREVO_API_KEY);

export async function sendEmailChangeEmail(toEmail: string, emailChangeCode: string, baseUrl: string) {
	const params = {
		ChangeEmailUrl: `${baseUrl}/email-change-${emailChangeCode}`,
	};

	sendEmail(changeEmailTemplateId, toEmail, params);
}

export async function sendPasswordChangeEmail(toEmail: string, passwordChangeCode: string, baseUrl: string) {
	const params = {
		ChangePasswordUrl: `${baseUrl}/password-change-${passwordChangeCode}`,
	};

	sendEmail(changePasswordTemplateId, toEmail, params);
}

export async function sendActivationEmail(toEmail: string, activationCode: number, baseUrl: string) {
	const params = {
		ActivationCode: activationCode,
		ActivationUrl: `${baseUrl}/registration-complete?email=${toEmail}&code=${activationCode}`,
	};

	sendEmail(activateAccountTemplateId, toEmail, params);
}

async function sendEmail(templateId: number, toEmail: string, params?: any) {
	const sendSmtpEmail = new SendSmtpEmail();
	sendSmtpEmail.templateId = templateId;
	sendSmtpEmail.to = [{ email: toEmail }];
	sendSmtpEmail.params = params;
	sendSmtpEmail.sender = { name: "Cockaigne City", email: "noreply@cockaigne.city" };

	const result = await brevoApi.sendTransacEmail(sendSmtpEmail);

	if (result.response.statusCode && result.response.statusCode >= 300) {
		logger.error(`Can't send e-mail: ${JSON.stringify(result, null, 2)}`);
	}
}
