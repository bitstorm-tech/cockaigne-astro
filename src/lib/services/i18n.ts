import sql from "@lib/services/pg";

const translations = await sql`select * from i18n`;
console.log("Translations loaded ...");

export function t(key: string, language: string): string {
	const row = translations.find((row) => row.key === key);
	if (!row) {
		return `MISSING_TRANSLATION (${key})`;
	}

	const translation = row[language];
	if (!translation) {
		return `UNSUPPORTED_TRANSLATION_LANG(${language})`;
	}

	return translation;
}
