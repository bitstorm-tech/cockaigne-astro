export function createBaseUrl(url: URL): string {
	return `${url.protocol}//${url.host}`;
}

export function redirect(location: string): Response {
	const response = new Response();
	response.headers.append("HX-Location", location);

	return response;
}

export function fullRedirect(location: string): Response {
	const response = new Response();
	response.headers.append("HX-Redirect", location);

	return response;
}

export function refresh(): Response {
	const response = new Response();
	response.headers.append("HX-Refresh", "true");

	return response;
}

export function extractDealImagesFromFormData(formData: FormData): Array<File | undefined> {
	const imageValue0 = formData.get("image0")?.valueOf();
	const imageValue1 = formData.get("image1")?.valueOf();
	const imageValue2 = formData.get("image2")?.valueOf();

	const image0 = imageValue0 ? (imageValue0 as File) : undefined;
	const image1 = imageValue1 ? (imageValue1 as File) : undefined;
	const image2 = imageValue2 ? (imageValue2 as File) : undefined;

	return [image0, image1, image2];
}
