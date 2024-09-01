export type SubscriptionState = "ACTIVE" | "CANCELED" | "WAITING_FOR_ACTIVATION";

export interface Subscription {
	id: string;
	accountId: string;
	planId: string;
	stripeSubscriptionId: string;
	stripeTrackingId: string;
	state: SubscriptionState;
	created: Date;
	activated: Date;
	canceled: Date;
}

export interface SubscriptionInsert {
	accountId: string;
	planId: string;
	stripeTrackingId: string;
	state: SubscriptionState;
}
