import { encryptJwt } from "@lib/services/auth";

export async function POST() {
  const jwt = await encryptJwt("hapftiBampfti", true, false);
  const headers = new Headers();
  headers.append("Set-Cookie", `jwt=${jwt}; HttpOnly; Path=/`);
  headers.append("Set-Cookie", `lang=de; HttpOnly; Path=/`);
  headers.append("HX-Location", "/");

  return new Response(null, { headers, status: 302 });
}
