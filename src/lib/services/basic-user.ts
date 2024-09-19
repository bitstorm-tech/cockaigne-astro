import { newBasicUser, type BasicUser } from "@lib/models/user";

export namespace BasicUserService {
	export function extractFromCookie(cookie: string): BasicUser {
		return newBasicUser();
	}
}
