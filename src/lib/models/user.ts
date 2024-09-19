import { Point } from "@lib/services/geo";

export interface User {
	id?: string;
	isProUser: boolean;
	isBasicUser: boolean;
	isDealer: boolean;
}

export interface BasicUser {
	location: Point;
	searchRadius: number;
	useLocationService: boolean;
	selectedCategories: number[];
}

export function newBasicUser(): BasicUser {
	return {
		location: Point.centerOfGermany(),
		searchRadius: 500,
		useLocationService: false,
		selectedCategories: [],
	};
}
