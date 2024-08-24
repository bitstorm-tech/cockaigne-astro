export function renderErrorPageTranslated(translationKey: string, lang: string): Response {
	return new Response(errorPage());
}

function errorPage(): string {
	return `
		<Layout>
			<section class="flex flex-col items-center gap-4 p-8 text-center">
				<h1>{t("error_page_title", lang)}</h1>
				<p>{t(messageTranslationKey, lang)}</p>
				<a class="btn btn-warning mt-4" href={templ.SafeURL(backUrl)}>{t("back", lang)}</a>
			</section>
		</Layout>`;
}
