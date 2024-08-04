import { incrementDealViewCount } from "@lib/services/deal";
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ params, locals }): Promise<Response> => {
  if (params.id) {
    incrementDealViewCount(params.id, locals.user.id);
  }

  return new Response();
};
