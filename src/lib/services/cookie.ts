export function getValueFromCookie(cookie: string, key: string): string | undefined {
	const tokens = cookie.split(";");
	return tokens.find((token) => token.includes(key))?.split("=")[1];
}
