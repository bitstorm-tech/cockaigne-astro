import type { Account, AccountUpdate } from "@lib/models/account";
import sql from "@lib/services/pg";
import bcrypt from "bcryptjs";
import { sendEmailChangeEmail, sendPasswordChangeEmail } from "./brevo";

export type UsernameAlreadyExistsError = string | undefined;
export type EmailAlreadyExistsError = string | undefined;
export type ChangeEmailError = string | undefined;
export type ChangePasswordError = string | undefined;
export type PreparePasswordChangeError = string | undefined;
export type InsertAccountError = string | undefined;

export async function accountExists(email: string, username: string): Promise<boolean> {
	const [result] =
		await sql`select exists(select id from accounts where email ilike ${email} or username ilike ${username})`;

	return result?.exists;
}

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

export async function insertAccount(
	account: Account,
): Promise<{ activationCode?: number; error?: InsertAccountError }> {
	const columnsToInsert = account.isDealer
		? <const>[
				"password",
				"username",
				"email",
				"language",
				"isDealer",
				"street",
				"city",
				"houseNumber",
				"zip",
				"phone",
				"taxId",
			]
		: <const>["password", "username", "email", "language", "age", "gender", "isDealer"];

	account.password = bcrypt.hashSync(account.password);

	const [result] = await sql`
		insert into accounts
		${sql(account, columnsToInsert)}
		returning id`;

	if (!result.id) {
		return { error: `Can't insert new account for ${account.email}` };
	}

	return {
		activationCode: 12345,
	};
}

export async function updateAccount(accountId: string, update: AccountUpdate): Promise<UsernameAlreadyExistsError> {
	if (update.username) {
		const [result] =
			await sql`select exists(select username from accounts where username ilike ${update.username} and id != ${accountId})`;
		if (result.exists) {
			return "Username already exists";
		}
	}

	await sql`update accounts set ${sql(update, "username")} where id = ${accountId}`;
}

export async function prepareEmailChange(
	accountId: string,
	newEmail: string,
	baseUrl: string,
): Promise<EmailAlreadyExistsError> {
	const [result] = await sql`select exists(select email from accounts where email ilike ${newEmail})`;

	if (result.exists) {
		return "Email already exists";
	}

	const [uuid] = await sql`
		update accounts
		set change_email_code = gen_random_uuid(), new_email = ${newEmail}
		where id = ${accountId}
		returning change_email_code`;

	sendEmailChangeEmail(newEmail, uuid.changeEmailCode, baseUrl);
}

export async function changeEmail(oldEmail: string, code: string): Promise<ChangeEmailError> {
	const [result] = await sql`
		update accounts
		set email = new_email, new_email = null, change_email_code = null
		where email ilike ${oldEmail} and change_email_code = ${code}
		returning change_email_code`;

	if (!result) {
		return "Can't change email";
	}
}

export async function preparePasswordChange(accountId: string, baseUrl: string): Promise<PreparePasswordChangeError> {
	const [account] = await sql<Account[]>`
		update accounts
		set change_password_code = gen_random_uuid()
		where id = ${accountId} returning email, change_password_code`;

	if (!account) {
		return `No account found for ID ${accountId}`;
	}

	sendPasswordChangeEmail(account.email, account.changePasswordCode!, baseUrl);
}

export async function changePassword(newPassword: string, code: string): Promise<ChangePasswordError> {
	const passwordHash = bcrypt.hashSync(newPassword);
	const [result] = await sql`
		update accounts
		set password = ${passwordHash}, change_password_code = null
		where change_password_code = ${code} returning id`;

	if (!result) {
		return `Could not change password for code ${code}`;
	}
}
