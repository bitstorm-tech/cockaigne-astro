import type { APIRoute } from "astro";

export const GET: APIRoute = async (): Promise<Response> => {
	return new Response("[]");
};
