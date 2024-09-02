import sql from "./pg";

export async function isLastContactMessageYoungerThenFiveMinutes(accountId: string): Promise<boolean> {
	const [result] = await sql`
		select true
		from contact_messages
		where account_id = ${accountId} and created >= (now() - interval '5 minutes')
		limit 1`;

	return !!result;
}

export async function saveContactMessage(accountId: string, message: string) {
	const update = { accountId, message };
	await sql`insert into contact_messages ${sql(update)}`;
}
