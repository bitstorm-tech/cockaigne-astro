import { newBasicUser } from "@lib/models/user";
import { decryptJwt, encryptJwt, type JwtPayload } from "@lib/services/auth";
import { getValueFromCookie } from "@lib/services/cookie";
import { defineMiddleware } from "astro/middleware";

export const onRequest = defineMiddleware(async (context, next) => {
	context.locals.user = {
		id: undefined,
		isDealer: false,
		isProUser: false,
		isBasicUser: true,
	};

	context.locals.basicUser = newBasicUser();

	const cookie = context.request.headers.get("cookie") || "";

	context.locals.language = getValueFromCookie(cookie, "lang") || "de";
	const jwt = getValueFromCookie(cookie, "jwt");

	if (jwt) {
		const jwtPayload = await decryptJwt<JwtPayload>(jwt);
		if (jwtPayload) {
			context.locals.user.id = jwtPayload.sub;
			context.locals.user.isDealer = jwtPayload.isDealer;
			context.locals.user.isProUser = jwtPayload.isProUser;
			context.locals.user.isBasicUser = !jwtPayload.sub;
		}
	}

	let basicUserCookie = "";

	if (context.locals.user.isBasicUser) {
		const basicUser = getValueFromCookie(cookie, "basicUser");

		if (!basicUser) {
			const basicUserPayload = await encryptJwt(context.locals.basicUser);
			basicUserCookie = `basicUser=${basicUserPayload}; HttpOnly; Path=/`;
		}

		context.locals.basicUser = basicUser ? (await decryptJwt(basicUser)) || newBasicUser() : newBasicUser();
	}

	const response = await next();

	if (basicUserCookie.length > 0) {
		response.headers.append("Set-Cookie", basicUserCookie);
	}

	return response;
});
