import { renderAlertTranslated } from "@lib/services/alerts";
import { getLanguageFromRequest } from "@lib/services/cookie";
import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  const lang = getLanguageFromRequest(request);

  return renderAlertTranslated("templates", lang);
};
