import type { Account, AccountUpdate } from "@lib/models/account";
import sql from "@lib/services/pg";
import { sendEmailChangeEmail } from "./brevo";

export type UsernameAlreadyExistsError = string;
export type EmailAlreadyExistsError = string;
export type ChangeEmailError = string;

export async function getAccountByEmail(email: string): Promise<Account | undefined> {
	if (!email?.length) {
		return;
	}

	const accounts = await sql<Account[]>`select * from accounts where email ilike ${email}`;
	return accounts[0];
}

export async function getAccountById(id: string): Promise<Account | undefined> {
	if (!id?.length) {
		return;
	}

	const account = await sql<Account[]>`select * from accounts where id = ${id}`;
	return account[0];
}

export async function getUsernameById(id: string): Promise<string | undefined> {
	if (!id?.length) {
		return;
	}

	const account = await sql<Account[]>`select * from accounts where id = ${id}`;
	return account[0]?.username;
}

export async function updateAccount(
	accountId: string,
	update: AccountUpdate,
): Promise<UsernameAlreadyExistsError | undefined> {
	if (update.username) {
		const result =
			await sql`select exists(select username from accounts where username ilike ${update.username} and id != ${accountId})`;
		if (result[0]?.exists) {
			return "Username already exists";
		}
	}

	await sql`update accounts set ${sql(update, "username")} where id = ${accountId}`;
}

export async function prepareEmailChange(
	accountId: string,
	newEmail: string,
	baseUrl: string,
): Promise<EmailAlreadyExistsError | undefined> {
	const [result] = await sql`select exists(select email from accounts where email ilike ${newEmail})`;

	if (result.exists) {
		return "Email already exists";
	}

	const [uuid] = await sql`update accounts
								set change_email_code = gen_random_uuid(), new_email = ${newEmail}
								where id = ${accountId}
								returning change_email_code`;

	sendEmailChangeEmail(newEmail, uuid.changeEmailCode, baseUrl);
}

export async function changeEmail(oldEmail: string, code: string): Promise<ChangeEmailError | undefined> {
	const [result] = await sql`update accounts
								set email = new_email, new_email = null, change_email_code = null
								where email ilike ${oldEmail} and change_email_code = ${code}
								returning change_email_code`;
	console.log("change email result:", result);
	if (!result) {
		return "Can't change email";
	}
}
