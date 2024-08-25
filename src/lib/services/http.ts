export function createBaseUrl(url: URL): string {
	return `${url.protocol}//${url.host}`;
}
