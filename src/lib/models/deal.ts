import type { Point } from "@lib/services/geo";

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

export interface DealInsert {
	dealerId: string;
	title: string;
	description: string;
	categoryId: number;
	durationInHours: number;
	start: Date;
	template: boolean;
	paymentState?: PaymentState;
	startInstantly: boolean;
	ownEndDate: boolean;
	images: Array<File | undefined>;
}

export interface DealUpdate {
	id: string;
	title: string;
	description: string;
	categoryId: number;
	start: Date;
	ownEndDate: boolean;
	durationInHours: number;
	startInstantly: boolean;
	deleteImages: Array<boolean>;
	newImages: Array<File | undefined>;
}

export interface DealHeader {
	id: string;
	dealerId: string;
	title: string;
	username: string;
	categoryId: number;
	canEdit: boolean;
	startTime: string;
	isFavorite: boolean;
}

export interface DealDetails {
	dealerId: string;
	title: string;
	description: string;
	imageUrls: string[];
	start: string;
	end: string;
}

export interface DealOnMap {
	location: Point;
	color: string;
}
