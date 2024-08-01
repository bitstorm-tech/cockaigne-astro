import { defineMiddleware } from "astro/middleware";

export const onRequest = defineMiddleware((context, next) => {
  // const cookie = context.request.headers.get("cookie");
  // console.log("cookie:", cookie);

  context.locals.user = {
    isAuthenticated: true,
    isDealer: true,
    isBasicUser: false,
    language: "de",
  };

  return next();
});
