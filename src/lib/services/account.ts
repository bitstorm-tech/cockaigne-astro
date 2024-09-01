import type { Account, DealerAccountUpdate, UserAccountUpdate } from "@lib/models/account";
import sql from "@lib/services/pg";
import bcrypt from "bcryptjs";
import { Err, Ok, Result } from "ts-results-es";
import { sendEmailChangeEmail, sendPasswordChangeEmail } from "./brevo";
import logger from "./logger";

export async function accountExists(email: string, username: string): Promise<boolean> {
	const [result] =
		await sql`select true from accounts where email ilike ${email} or username ilike ${username} limit 1`;

	return !!result;
}

export async function activateAccount(code: string): Promise<boolean> {
	const [result] =
		await sql`update accounts set active = true, activation_code = null where activation_code = ${code} returning id`;

	return !!result;
}

export async function getAccountByEmail(email: string): Promise<Account | undefined> {
	const [account] = await sql<Account[]>`select * from accounts where email ilike ${email}`;

	if (!account) {
		logger.warn(`Can't find account by email ${email}`);
		return;
	}

	return account;
}

export async function getAccountById(id: string): Promise<Account | undefined> {
	const [account] = await sql<Account[]>`select * from accounts where id = ${id}`;

	if (!account) {
		logger.warn(`Can't find account by ID ${id}`);
		return;
	}

	return account;
}

export async function getUsernameById(id: string): Promise<string | undefined> {
	const [account] = await sql<Account[]>`select * from accounts where id = ${id}`;

	if (!account) {
		logger.warn(`Can't get username by ID ${id}`);
		return;
	}

	return account.username;
}

export async function insertAccount(account: Account): Promise<Result<number, string>> {
	// prettier-ignore
	const columnsToInsert = account.isDealer
		? <const>["password", "username", "email", "language", "isDealer", "activationCode", "location", "street", "city", "houseNumber", "zip", "phone", "taxId"]
		: <const>["password", "username", "email", "language", "isDealer", "activationCode", "location", "age", "gender"];

	account.password = bcrypt.hashSync(account.password);
	account.activationCode = generateActivationCode();

	const [result] = await sql`
		insert into accounts
		${sql(account, columnsToInsert)}
		returning activation_code`;

	if (!result) {
		return Err(`Can't insert new account for ${account.email}`);
	}

	return Ok(result.activationCode);
}

function generateActivationCode(): number {
	const randomNumber = Math.floor(Math.random() * 1_000_000_000_000) % 1_000_000;
	return +randomNumber.toString().padEnd(6, "0");
}

export async function updateAccount(
	accountId: string,
	update: UserAccountUpdate | DealerAccountUpdate,
): Promise<Error | undefined> {
	if (update.username) {
		const [result] =
			await sql`select true from accounts where username ilike ${update.username} and id != ${accountId} limit 1`;
		if (result) {
			return Error("Username already exists");
		}
	}

	await sql`update accounts set ${sql(update)} where id = ${accountId}`;
}

export async function prepareEmailChange(
	accountId: string,
	newEmail: string,
	baseUrl: string,
): Promise<Error | undefined> {
	const [result] = await sql`select true from accounts where email ilike ${newEmail} limit 1`;

	if (result) {
		return Error(`Email ${newEmail} already exists`);
	}

	const [uuid] = await sql`
		update accounts
		set change_email_code = gen_random_uuid(), new_email = ${newEmail}
		where id = ${accountId}
		returning change_email_code`;

	sendEmailChangeEmail(newEmail, uuid.changeEmailCode, baseUrl);
}

export async function changeEmail(oldEmail: string, code: string): Promise<Error | undefined> {
	const [result] = await sql`
		update accounts
		set email = new_email, new_email = null, change_email_code = null
		where email ilike ${oldEmail} and change_email_code = ${code}
		returning change_email_code`;

	if (!result) {
		return Error(`Can't change email ${oldEmail}`);
	}
}

export async function preparePasswordChange(
	baseUrl: string,
	accountId?: string,
	email?: string,
): Promise<Error | undefined> {
	const [account] = await sql<Account[]>`
		update accounts
		set change_password_code = gen_random_uuid()
		where id = ${accountId || sql`uuid_nil()`} or email ilike ${email || ""} returning email, change_password_code`;

	if (!account) {
		return Error(`No account found for ID ${accountId}`);
	}

	sendPasswordChangeEmail(account.email, account.changePasswordCode!, baseUrl);
}

export async function changePassword(newPassword: string, code: string): Promise<Error | undefined> {
	const passwordHash = bcrypt.hashSync(newPassword);
	const [result] = await sql`
		update accounts
		set password = ${passwordHash}, change_password_code = null
		where change_password_code = ${code} returning id`;

	if (!result) {
		return Error(`Could not change password for code ${code}`);
	}
}
