import { None, Some, type Option } from "ts-results-es";
import logger from "./logger";

export interface NominatimResponse {
	lon: number;
	lat: number;
	display_name: string;
}

export class Extent {
	constructor(
		public a: number,
		public b: number,
		public c: number,
		public d: number,
	) {}

	static fromString(extent: string): Extent | undefined {
		const tokens = extent.split(",");
		const numbers = tokens.map((token) => Number(token)).filter((token) => !isNaN(token));

		if (numbers.length !== 4) {
			logger.error(`Can't create extent from string '${extent}'`);
			return;
		}

		return new Extent(numbers[0], numbers[1], numbers[2], numbers[3]);
	}
}

export class Point {
	constructor(
		public lon: number,
		public lat: number,
	) {}

	static fromNominatimResponse(response: NominatimResponse): Point {
		return new Point(response.lon, response.lat);
	}

	static centerOfGermany(): Point {
		return new Point(10.447683, 51.163361);
	}

	static fromWkt(wkt: string): Point {
		const match = wkt.match(/POINT\(([-+]?\d*\.?\d+)\s([-+]?\d*\.?\d+)\)/);

		if (!match) {
			logger.error(`Can't convert WKT '${wkt}' to Point`);
			return new Point(0, 0);
		}

		const lon = parseFloat(match[1]);
		const lat = parseFloat(match[2]);

		return new Point(lon, lat);
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
): Promise<Option<Point>> {
	city = encodeURIComponent(city);
	street = encodeURIComponent(street);
	houseNumber = encodeURIComponent(houseNumber);
	const query = `
		https://nominatim.openstreetmap.org/search?format=json
		&street=${houseNumber},${street}
		&city=${city}
		&postalcode=${zipCode}`;

	const response = await fetch(query);
	const nominatimResponse = (await response.json()) as NominatimResponse[];

	if (nominatimResponse.length === 0) {
		logger.warn(
			`Found no location for address: street=${street} houseNumber=${houseNumber} city=${city} zipCode=${zipCode}`,
		);
		return None;
	}

	return Some(Point.fromNominatimResponse(nominatimResponse[0]));
}
