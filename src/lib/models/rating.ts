export interface Rating {
	dealerId: string;
	userId: string;
	stars: number;
	text: string;
	username: string;
	canEdit: boolean;
	created?: Date;
}
