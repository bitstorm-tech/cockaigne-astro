import logger from "./logger";

export function notForBasicUser(location: string): Response {
	logger.error(`Basic user tried to visit following location: ${location} -> redirect to index`);

	const response = new Response();
	response.headers.append("HX-Location", "/");

	return response;
}
