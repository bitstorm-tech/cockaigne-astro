import { t } from "./i18n";

export function renderToastTranslated(translationKey: string, lang: string): Response {
	const headers = new Headers();
	headers.append("HX-Retarget", "#toast");
	const message = t(translationKey, lang);

	return new Response(toast(message), { headers });
}

function toast(message: string): string {
	return `
		<div id="toast" class="toast toast-center bottom-14" hx-delete="/api/ui/remove" hx-target="closest #toast" hx-swap="outerHTML" hx-trigger="load delay:2s">
			<div class="alert alert-success">
				<span>${message}</span>
			</div>
		</div>`;
}
