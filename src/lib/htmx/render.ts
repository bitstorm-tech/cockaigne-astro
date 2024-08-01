import { t } from "@lib/services/i18n";

export function renderAlertTranslated(translationKey: string, lang: string): Response {
  const headers = new Headers();
  headers.append("HX-Retarget", "#alert");
  const message = t(translationKey, lang);
  return new Response(alert(message), { headers });
}

function alert(message: string): string {
  return `
	<div id="alert" class="fade-in fade-out absolute bottom-14 left-6 right-6 z-50 flex items-center justify-between gap-2 rounded-xl p-2 bg-warning">
		<span class="pl-4">${message}</span>
		<button
			hx-target="closest #alert"
			hx-delete="/api/ui/remove"
			hx-swap="outerHTML swap:0.2s"
			class="btn-primary"
		>
			OK
		</button>
	</div>
`;
}
