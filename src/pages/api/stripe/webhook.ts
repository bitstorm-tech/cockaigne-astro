import logger from "@lib/services/logger";
import { checkoutCompleted, subscriptionExpired, updateSubscriptionPlan } from "@lib/services/subscription";
import type { APIRoute } from "astro";
import Stripe from "stripe";

const stripe = new Stripe(import.meta.env.STRIPE_PRIVATE_API_KEY);
const stripeWebhookSecret = import.meta.env.STRIPE_WEBHOOK_SECRET;

export const POST: APIRoute = async ({ request }): Promise<Response> => {
	const body = await request.text();
	const stripeSignature = request.headers.get("stripe-signature")?.toString();

	if (!stripeWebhookSecret) {
		logger.error(`Missing Stripe Webhook Secret!`);
	}

	if (!stripeSignature) {
		logger.error(`Invalid Stripe Signature!`);
	}

	const event = stripe.webhooks.constructEvent(body, stripeSignature!, stripeWebhookSecret);

	switch (event.type) {
		case "checkout.session.completed":
		case "checkout.session.expired":
			checkoutSessionCompleted(event);
			break;
		case "customer.subscription.deleted":
			customerSubscriptionDeleted(event);
			break;
		case "customer.subscription.updated":
			customerSubscriptionUpdate(event);
	}

	return new Response();
};

function checkoutSessionCompleted(event: Stripe.CheckoutSessionCompletedEvent | Stripe.CheckoutSessionExpiredEvent) {
	const trackingId = event.data.object.metadata?.stripeTrackingId;

	if (!trackingId) {
		logger.error(`Can't complete checkout session -> missing tracking ID`);
		return;
	}

	const subscriptionId = event.data.object.subscription?.toString();

	if (!subscriptionId) {
		logger.error(`Can't complete checkout session -> missing subscription ID`);
		return;
	}

	checkoutCompleted(trackingId, subscriptionId);
}

function customerSubscriptionDeleted(event: Stripe.CustomerSubscriptionDeletedEvent) {
	const subscriptionId = event.data.object.id;
	subscriptionExpired(subscriptionId);
}

function customerSubscriptionUpdate(event: Stripe.CustomerSubscriptionUpdatedEvent) {
	const subscriptionId = event.data.object.id;
	const newPrice = event.data.object.items.data[0]?.price.id;
	const oldPrice = event.data.previous_attributes?.items?.data[0]?.price.id;

	if (newPrice && oldPrice && newPrice !== oldPrice) {
		logger.info(`Subscription ${subscriptionId} changed plan from ${oldPrice} to ${newPrice}`);
		updateSubscriptionPlan(subscriptionId, newPrice);
	}
}
