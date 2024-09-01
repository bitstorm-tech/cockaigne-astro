export interface Summary {
	start: Date;
	end: Date;
	duration: number;
	price: number;
	priceWithDiscount: number;
	discount: number;
	freeDaysLeft: number;
	error: boolean;
}
