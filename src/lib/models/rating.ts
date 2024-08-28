export interface Rating {
	dealerId: string;
	userId: string;
	stars: number;
	text: string;
	username: string;
	created?: Date;
}

export interface RatingUpsert {
	dealerId: string;
	userId: string;
	text: string;
	stars: number;
}
