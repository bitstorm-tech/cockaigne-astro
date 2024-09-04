export async function GET() {
	const headers = new Headers();
	headers.append("Set-Cookie", "jwt=; HttpOnly; Path=/");
	headers.append("Location", "/login");

	return new Response(null, { headers, status: 302 });
}
