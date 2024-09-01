import type { SubscriptionInsert } from "@lib/models/subscription";
import Stripe from "stripe";
import { getPriceId, insertSubscription } from "./subscription";

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
		mode: "subscription",
		success_url: `${baseUrl}/api/subscriptions/success`,
		cancel_url: `${baseUrl}/api/subscriptions/cancel-checkout-${stripeTrackingId}`,
	});

	const subscriptionInsert: SubscriptionInsert = {
		accountId,
		planId,
		state: "WAITING_FOR_ACTIVATION",
		stripeTrackingId,
	};

	await insertSubscription(subscriptionInsert);

	return session.url!;
}
