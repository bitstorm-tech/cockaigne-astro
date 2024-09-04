export function createBaseUrl(url: URL): string {
	return `${url.protocol}//${url.host}`;
}

export function redirect(location: string): Response {
	const response = new Response();
	response.headers.append("HX-Location", location);

	return response;
}

export function refresh(): Response {
	const response = new Response();
	response.headers.append("HX-Refresh", "true");

	return response;
}
