import type { Subscription, SubscriptionInsert, SubscriptionState } from "@lib/models/subscription";
import dayjs from "dayjs";
import Stripe from "stripe";
import sql from "./pg";

const stripe = new Stripe(import.meta.env.STRIPE_PRIVATE_API_KEY);

export async function createSubscription(accountId: string, planId: string, baseUrl: string): Promise<string> {
	const priceId = await getPriceId(planId);
	const stripeTrackingId = crypto.randomUUID();

	const session = await stripe.checkout.sessions.create({
		line_items: [
			{
				price: priceId,
				quantity: 1,
			},
		],
		metadata: {
			stripeTrackingId,
		},
		mode: "subscription",
		success_url: `${baseUrl}`,
		cancel_url: `${baseUrl}/api/subscriptions/cancel-checkout-${stripeTrackingId}`,
	});

	const subscriptionInsert: SubscriptionInsert = {
		accountId,
		planId,
		state: "WAITING_FOR_ACTIVATION",
		stripeTrackingId,
	};

	await sql`insert into subscriptions ${sql(subscriptionInsert)}`;

	return session.url!;
}

export async function checkoutCompleted(trackingId: string, stripeSubscriptionId: string) {
	const update = {
		state: "ACTIVE" as SubscriptionState,
		activated: dayjs().toDate(),
		stripeSubscriptionId,
	};

	await sql`
		update subscriptions
		set ${sql(update)}
		where stripe_tracking_id = ${trackingId}`;
}

export async function subscriptionExpired(subscriptionId: string) {
	const expiredState: SubscriptionState = "EXPIRED";
	const cancelDate = dayjs().toDate();

	await sql`
		update subscriptions
		set state = ${expiredState}, canceled = ${cancelDate}
		where stripe_subscription_id = ${subscriptionId}`;
}

export async function removePendingCheckout(trackingId: string) {
	await sql`delete from subscriptions where stripe_tracking_id = ${trackingId} and state = 'WAITING_FOR_ACTIVATION'`;
}

export async function updateSubscriptionPlan(subscriptionId: string, newPrice: string) {
	await sql`
		update subscriptions
		set plan_id = plans.id
		from plans
		where plans.stripe_price_id = ${newPrice} and subscriptions.stripe_subscription_id = ${subscriptionId}`;
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
