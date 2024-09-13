import { activateDealByDealId, activateDealByStripePaymentIntentId, setPaymentIntentId } from "@lib/services/deal";
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
			break;
		case "payment_intent.succeeded":
			paymentIntentSucceeded(event);
			break;
	}

	return new Response();
};

async function checkoutSessionCompleted(
	event: Stripe.CheckoutSessionCompletedEvent | Stripe.CheckoutSessionExpiredEvent,
) {
	const trackingId = event.data.object.metadata?.stripeTrackingId;
	const dealId = event.data.object.metadata?.dealId;

	if (!trackingId && !dealId) {
		logger.error(`Can't complete checkout session -> neither tracking ID nor deal ID is present as metadata`);
		return;
	}

	if (trackingId) {
		const subscriptionId = event.data.object.subscription?.toString();

		if (!subscriptionId) {
			logger.error(`Can't complete checkout session -> missing subscription ID`);
			return;
		}

		checkoutCompleted(trackingId, subscriptionId);
	}

	if (dealId) {
		const paymentIntentId = event.data.object.payment_intent?.toString();

		if (!paymentIntentId) {
			logger.error(`Can't complete checkout session -> missing payment intent ID`);
			return;
		}

		const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
		if (paymentIntent.status === "succeeded") {
			activateDealByDealId(dealId);
		} else {
			logger.warn(
				`Checkout session completed but payment intent not yet succeeded -> set payment intent id to deal ${dealId} for later proccessing`,
			);
			setPaymentIntentId(dealId, paymentIntentId);
		}
	}
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

function paymentIntentSucceeded(event: Stripe.PaymentIntentSucceededEvent) {
	const paymentIntentId = event.id;
	activateDealByStripePaymentIntentId(paymentIntentId);
}
