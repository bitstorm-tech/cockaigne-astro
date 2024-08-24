import type { Account, AccountUpdate } from "@lib/models/account";
import sql from "@lib/services/pg";

export type UsernameAlreadyExistsError = string;

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
	return;
}
