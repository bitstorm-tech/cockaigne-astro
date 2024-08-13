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
	useLocationService: boolean;
	searchRadiusInMeter: number;
	location: string;
	active: boolean;
	changePasswordCode?: string;
	changeEmailCode?: string;
	newEmail?: string;
}
