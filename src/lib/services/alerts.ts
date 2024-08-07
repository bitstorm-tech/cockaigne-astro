import { t } from "@lib/services/i18n";

export type AlertType = "warning" | "info";

export function renderAlertTranslated(translationKey: string, lang: string, type?: AlertType): Response {
  const headers = new Headers();
  headers.append("HX-Retarget", "#alert");
  headers.append("HX-Reswap", "innterHTML");
  const message = t(translationKey, lang);
  return new Response(alert(message, type), { headers });
}

export function renderInfoTranslated(translationKey: string, lang: string): Response {
  return renderAlertTranslated(translationKey, lang, "info");
}

function alert(message: string, type?: AlertType): string {
  const color = type === "info" ? "bg-success text-primary" : "bg-warning";
  return `
	<div id="alert-inner" class="fade-in fade-out absolute bottom-14 left-6 right-6 z-50 flex items-center justify-between gap-2 rounded-xl p-2 ${color}">
		<span class="pl-4">${message}</span>
		<button
			hx-target="closest #alert-inner"
			hx-delete="/api/ui/remove"
			hx-swap="outerHTML swap:0.2s"
			class="btn-primary"
		>
			OK
		</button>
	</div>
`;
}
