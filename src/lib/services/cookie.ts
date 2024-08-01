export function getValueFromCookie(cookie: string, key: string): string | undefined {
  const tokens = cookie.split(";");
  return tokens.find((token) => token.includes(key))?.split("=")[1];
}

export function getLanguageFromRequest(request: Request): string {
  const cookie = request.headers.get("cookie");
  if (!cookie) {
    return "de";
  }

  return getValueFromCookie(cookie, "lang") || "de";
}
