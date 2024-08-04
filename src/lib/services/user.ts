import sql from "@lib/services/pg";

export async function getFavoriteDealersCount(userId: string): Promise<number> {
  const result = await sql`select count(*) from favorite_dealers_view where user_id = ${userId}`;

  return result[0].count;
}

export async function getFavoriteDealsCount(userId: string): Promise<number> {
  const result = await sql`
	select count(*) from favorite_deals f 
	join active_deals_view a on a.id = f.deal_id 
  	where f.user_id = ${userId}`;

  return result[0].count;
}
