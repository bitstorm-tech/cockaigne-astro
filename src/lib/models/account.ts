import type { Point } from "@lib/services/geo";

export interface Account {
	id: string;
	username: string;
	email: string;
	language: string;
	age?: number;
	gender?: string;
	password: string;
	isDealer: boolean;
	street?: string;
	houseNumber?: string;
	city?: string;
	zip?: number;
	phone?: string;
	taxId?: string;
	defaultCategory?: number;
	useLocationService: boolean;
	searchRadiusInMeter: number;
	location: Point;
	active: boolean;
	changePasswordCode?: string;
	changeEmailCode?: string;
	newEmail?: string;
	activationCode?: number;
}

export interface UserAccountUpdate {
	username?: string;
}

export interface DealerAccountUpdate extends UserAccountUpdate {
	phone?: string;
	taxId?: string;
	defaultCategory?: number;
}
