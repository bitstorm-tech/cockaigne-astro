import type { Subscription, SubscriptionInsert, SubscriptionState } from "@lib/models/subscription";
import dayjs, { type Dayjs } from "dayjs";
import Stripe from "stripe";
import logger from "./logger";
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
		automatic_tax: {
			enabled: true,
		},
		tax_id_collection: {
			enabled: true,
		},
		payment_method_types: ["card", "paypal"],
		shipping_address_collection: {
			allowed_countries: ["DE"],
		},
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

export async function doDynamicPayment(daysToPay: number, dealId: string, baseUrl: string): Promise<string> {
	const session = await stripe.checkout.sessions.create({
		line_items: [
			{
				quantity: 1,
				price_data: {
					unit_amount: daysToPay * 499,
					currency: "EUR",
					product_data: {
						name: `Preis für ${daysToPay} Tag(e) Laufzeit`,
					},
				},
			},
		],
		automatic_tax: {
			enabled: true,
		},
		tax_id_collection: {
			enabled: true,
		},
		payment_method_types: ["card", "paypal"],
		shipping_address_collection: {
			allowed_countries: ["DE"],
		},
		metadata: {
			dealId,
		},
		mode: "payment",
		success_url: `${baseUrl}`,
		cancel_url: `${baseUrl}`,
	});

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
		set plan_id = plans.id, activated = now()
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

export interface CurrentSubscripitonPeriod {
	start: Dayjs;
	end: Dayjs;
}

export async function getFreeDaysLeftInCurrentSubscriptionPeriod(
	dealerId: string,
	currentSubscriptionPeriod?: CurrentSubscripitonPeriod,
): Promise<number> {
	if (!currentSubscriptionPeriod) {
		currentSubscriptionPeriod = await getCurrentSubscriptionPeriod(dealerId);
	}

	if (!currentSubscriptionPeriod) {
		logger.error(`Can't get free days left in current subscription period -> can't get current subscription period`);
		return 0;
	}

	const startDate = currentSubscriptionPeriod.start.format("YYYY-MM-DD");
	const endDate = currentSubscriptionPeriod.end.format("YYYY-MM-DD");

	const [result] = await sql`
		select greatest(0, p.free_days_per_month - (sum(duration_in_hours) / 24)::int) as free_days_left
		from deals d
		join subscriptions s on s.account_id = d.dealer_id
		join plans p on p.id = s.plan_id
		where d.dealer_id = ${dealerId} and d.created between ${startDate} and ${endDate} and template is false and payment_state = 'PAYED'
		group by p.free_days_per_month`;

	return result.freeDaysLeft;
}

export async function getHighestVoucherDiscount(dealerId: string): Promise<number> {
	const [result] = await sql`
		select coalesce(max(discount_in_percent), 0) as discount from active_vouchers_view where account_id = ${dealerId}`;

	return result.discount;
}

export async function getCurrentSubscriptionPeriod(dealerId: string): Promise<CurrentSubscripitonPeriod | undefined> {
	const [result] = await sql<{ activated: Date; name: string; stripeSubscriptionId: string }[]>`
		select activated, name, stripe_subscription_id
		from subscriptions s
		join plans p on s.plan_id = p.id
		where account_id = ${dealerId} and state = 'ACTIVE'
		limit 1`;

	if (!result) {
		logger.error(`Can't get current subscription period -> no active subscription found for dealer ${dealerId}`);
		return;
	}

	if (result.name.toLowerCase().includes("month")) {
		return await getCurrentSubscriptionPeriodFromStripe(result.stripeSubscriptionId);
	}

	return calculateSubscriptionPeriod(result.activated);
}

async function getCurrentSubscriptionPeriodFromStripe(
	stripeSubscriptionId: string,
): Promise<CurrentSubscripitonPeriod> {
	const response = await stripe.subscriptions.retrieve(stripeSubscriptionId);

	return {
		start: dayjs(response.current_period_start * 1000),
		end: dayjs(response.current_period_end * 1000),
	};
}

export function calculateSubscriptionPeriod(activationDate: Date, today = dayjs()): CurrentSubscripitonPeriod {
	const todayDay = today.date();
	const activationDay = dayjs(activationDate).date();

	let endMonth = today.month() + (todayDay < activationDay ? 1 : 2);
	let endYear = today.year();

	if (endMonth > 12) {
		endMonth = 1;
		endYear += 1;
	}

	const endDay = Math.min(activationDay, dayjs(`${endYear}-${endMonth}`).endOf("month").date());

	const startYear = endMonth === 1 ? endYear - 1 : endYear;
	const startMonth = endMonth === 1 ? 12 : endMonth - 1;
	const startDay = Math.min(activationDay, dayjs(`${startYear}-${startMonth}`).endOf("month").date());

	return {
		start: dayjs(`${startYear}-${startMonth}-${startDay}`),
		end: dayjs(`${endYear}-${endMonth}-${endDay}`),
	};
}
