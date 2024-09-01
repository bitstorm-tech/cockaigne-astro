export type PaymentState = "PAYED" | "PAYMENT_PENDING";

export interface Deal {
	id: string;
	dealerId: string;
	title: string;
	description: string;
	categoryId: number;
	durationInHours: number;
	start: Date;
	template: boolean;
	created?: Date;
	paymentState?: PaymentState;
	startInstantly: boolean;
	ownEndDate: boolean;
}
