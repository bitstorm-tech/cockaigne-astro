import type { Account } from "@lib/models/account";
import sql from "@lib/persistence/pg";

export async function getAccountByEmail(email: string): Promise<Account | undefined> {
  const accounts = await sql<Account[]>`select * from accounts where email ilike ${email}`;
  return accounts[0];
}
