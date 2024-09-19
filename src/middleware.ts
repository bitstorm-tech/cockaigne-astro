import { type BasicUser, newBasicUser } from "@lib/models/user";
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

	const response = await next();

	if (context.locals.user.isBasicUser) {
		const basicUser = getValueFromCookie(cookie, "basicUser");
		if (basicUser) {
			context.locals.basicUser = (await decryptJwt<BasicUser>(basicUser)) || newBasicUser();
		} else {
			const basicUserPayload = await encryptJwt(context.locals.basicUser);
			response.headers.append("Set-Cookie", `basicUser=${basicUserPayload}; HttpOnly; Path=/`);
		}
	}

	return response;
});
