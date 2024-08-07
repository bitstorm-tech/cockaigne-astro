import { decryptJwt } from "@lib/services/auth";
import { getValueFromCookie } from "@lib/services/cookie";
import { defineMiddleware } from "astro/middleware";

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.user = {
    id: undefined,
    isDealer: false,
    isProUser: false,
    language: "de",
  };

  const cookie = context.request.headers.get("cookie");
  if (!cookie) {
    return next();
  }

  context.locals.user.language = getValueFromCookie(cookie, "lang") || "de";
  const jwt = getValueFromCookie(cookie, "jwt");

  if (jwt?.length) {
    const jwtPayload = await decryptJwt(jwt);
    if (jwtPayload) {
      context.locals.user.id = jwtPayload.sub;
      context.locals.user.isDealer = jwtPayload.isDealer;
      context.locals.user.isProUser = jwtPayload.isProUser;
    }
  }

  return next();
});
