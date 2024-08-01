import { renderAlertTranslated } from "@lib/htmx/render";
import { getAccountByEmail } from "@lib/services/account";
import { encryptJwt } from "@lib/services/auth";
import { getLanguageFromRequest } from "@lib/services/cookie";
import type { APIRoute } from "astro";
import bcrypt from "bcrypt";

export const POST: APIRoute = async ({ request }) => {
  const formData = await request.formData();
  const email = formData.get("email")?.toString();
  const lang = getLanguageFromRequest(request);
  if (!email) {
    return renderAlertTranslated("alert.invalid_username_or_password", lang);
  }

  const account = await getAccountByEmail(email);
  if (!account) {
    return renderAlertTranslated("alert.invalid_username_or_password", lang);
  }

  const password = formData.get("password")?.toString();
  const passwordCorrect = await bcrypt.compare(password, account.password);
  if (!passwordCorrect) {
    return renderAlertTranslated("alert.invalid_username_or_password", lang);
  }

  const jwt = await encryptJwt(account?.id, true, false);
  const headers = new Headers();
  headers.append("Set-Cookie", `jwt=${jwt}; HttpOnly; Path=/`);
  headers.append("Set-Cookie", `lang=de; HttpOnly; Path=/`);
  headers.append("HX-Location", "/");

  return new Response(null, { headers, status: 302 });
};
