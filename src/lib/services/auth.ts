import type { BasicUser } from "@lib/models/user";
import * as jose from "jose";
import { Point } from "./geo";

const JWT_SECRET = jose.base64url.decode(import.meta.env.JWT_SECRET);

export interface JwtPayload {
	sub: string;
	isDealer: boolean;
	isProUser: boolean;
}

export async function encryptJwt(payload: JwtPayload | BasicUser): Promise<string> {
	return await new jose.SignJWT(payload as unknown as jose.JWTPayload)
		.setProtectedHeader({ alg: "HS512", typ: "JWT" })
		.sign(JWT_SECRET);
}

export async function decryptJwt<T extends JwtPayload | BasicUser>(jwt: string): Promise<T | undefined> {
	try {
		const { payload } = await jose.jwtVerify<T>(jwt, JWT_SECRET);

		if ("location" in payload) {
			const { lon, lat } = payload.location as { lon: number; lat: number };
			payload.location = new Point(lon, lat);
		}

		return payload;
	} catch {
		return;
	}
}
