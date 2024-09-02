import type { Subscription, SubscriptionInsert } from "@lib/models/subscription";
import dayjs from "dayjs";
import sql from "./pg";

export async function insertSubscription(insert: SubscriptionInsert) {
	await sql`insert into subscriptions ${sql(insert)}`;
}

export async function cancelSubscription(trackingId: string) {
	await sql`delete from subscriptions where stripe_tracking_id = ${trackingId} and state = 'WAITING_FOR_ACTIVATION'`;
}

export async function getPriceId(planId: string): Promise<string | undefined> {
	const [result] = await sql`select stripe_price_id from plans where id = ${planId}`;

	if (!result) {
		return;
	}

	return result.stripePriceId;
}

export async function hasActiveSubscription(dealerId: string): Promise<boolean> {
	const [result] =
		await sql`select true from subscriptions where account_id = ${dealerId} and state = 'ACTIVE' limit 1`;

	return !!result;
}

export async function getActiveSubscription(dealerId: string): Promise<Subscription | undefined> {
	const [result] = await sql<Subscription[]>`
		select * from subscriptions where account_id = ${dealerId} and state = 'ACTIVE' limit 1`;

	if (!result) {
		return;
	}

	return result;
}

export async function getFreeDaysLeft(dealerId: string): Promise<number> {
	return 0;
}

export async function getHighestVoucherDiscount(dealerId: string): Promise<number> {
	const [result] = await sql`
		select coalesce(max(discount_in_percent), 0) as discount from active_vouchers_view where account_id = ${dealerId}`;

	return result.discount;
}

export async function getCurrentSubscriptionPeriodEndDate(dealerId: string): Promise<Date | undefined> {
	const [result] =
		await sql`select activated from subscriptions where account_id = ${dealerId} and state = 'ACTIVE' limit 1`;

	if (!result) {
		return;
	}

	const day = dayjs(result.activated).date();
	let month = dayjs().month() + (dayjs().date() < day ? 1 : 2);
	let year = dayjs().year();

	if (month > 12) {
		month = 1;
		year += 1;
	}

	return dayjs(`${year}-${month}-${day}`).toDate();
}
