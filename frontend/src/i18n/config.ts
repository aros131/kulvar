export const locales = ["tr", "en", "fr"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "tr";
export const localeCookieName = "PERSE_LOCALE";

export const localeLabels: Record<Locale, string> = {
  tr: "Türkçe",
  en: "English",
  fr: "Français",
};
