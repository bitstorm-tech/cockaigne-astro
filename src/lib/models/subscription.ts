export type SubscriptionState = "ACTIVE" | "CANCELED";

export interface Subscription {
	id: string;
	accountId: string;
	planId: number;
	stripeSubscriptionId: string;
	stripeTrackingId: string;
	state: Subscription;
	created: Date;
	activated: Date;
	canceled: Date;
}
