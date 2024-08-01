import { decryptJwt } from "@lib/services/auth";
import { defineMiddleware } from "astro/middleware";
import { jwtVerify } from "jose";

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.user = {
    id: "",
    isAuthenticated: false,
    isDealer: false,
    isBasicUser: true,
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
      context.locals.user.isBasicUser = jwtPayload.isBasicUser;
      context.locals.user.isAuthenticated = true;
    }
  }

  return next();
});

function getValueFromCookie(cookie: string, key: string): string | undefined {
  const tokens = cookie.split(";");
  return tokens.find((token) => token.includes(key))?.split("=")[1];
}
