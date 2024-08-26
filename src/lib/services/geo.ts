import { Err, Ok, type Result } from "ts-results-es";

export interface NominatimResponse {
	lon: number;
	lat: number;
	display_name: string;
}

export class Point {
	constructor(
		private lon: number,
		private lat: number,
	) {}

	static fromNominatimResponse(response: NominatimResponse): Point {
		return new Point(response.lon, response.lat);
	}

	static centerOfGermany(): Point {
		return new Point(10.447683, 51.163361);
	}

	toWkt(): string {
		return `POINT(${this.lon} ${this.lat})`;
	}

	toString(): string {
		return this.toWkt();
	}
}

export async function getLocationFromAddress(
	street: string,
	houseNumber: string,
	city: string,
	zipCode: number,
): Promise<Result<Point, string>> {
	city = encodeURIComponent(city);
	street = encodeURIComponent(street);
	houseNumber = encodeURIComponent(houseNumber);
	const query = `https://nominatim.openstreetmap.org/search?format=json&street=${houseNumber},${street}&city=${city}&postalcode=${zipCode}`;

	const response = await fetch(query);
	const nominatimResponse = (await response.json()) as NominatimResponse[];

	if (nominatimResponse.length === 0) {
		return Err(
			`Found no location for address: street=${street} houseNumber=${houseNumber} city=${city} zipCode=${zipCode}`,
		);
	}

	return Ok(Point.fromNominatimResponse(nominatimResponse[0]));
}
