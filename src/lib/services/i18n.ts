import sql from "@lib/services/pg";

const translations = await sql`select * from i18n`;
console.log("Translations loaded ...");

export function t(key: string, language: string): string {
  const row = translations.find((row) => row.key === key);
  if (!row) {
    return "___MISSING_TRANSLATION___";
  }

  const translation = row[language];
  if (!translation) {
    return `___UNSUPPORTED_TRANSLATION_LANG(${language})___`;
  }

  return translation;
}
