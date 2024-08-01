import { defineMiddleware } from "astro/middleware";
import { User } from "./lib/models/user";

export const onRequest = defineMiddleware((context, next) => {
  context.locals.user = new User();
  return next();
});
