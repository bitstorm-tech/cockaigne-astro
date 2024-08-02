import type { Account } from "@lib/models/account";
import sql from "@lib/persistence/pg";

export async function getAccountByEmail(email: string): Promise<Account | undefined> {
  if (email.length === 0) {
    return;
  }

  const accounts = await sql<Account[]>`select * from accounts where email ilike ${email}`;
  return accounts[0];
}

export async function getAccountById(id: string): Promise<Account | undefined> {
  if (id.length === 0) {
    return;
  }

  const account = await sql<Account[]>`select * from accounts where id = ${id}`;
  return account[0];
}

export async function getUsernameById(id: string): Promise<string> {
  if (id.length === 0) {
    return "";
  }

  const account = await sql<Account[]>`select * from accounts where id = ${id}`;
  return account[0]?.username;
}
