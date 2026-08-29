import { defaultLocale, isLocale, type Locale } from "@/lib/locale";

const dictionaries = {
  ar: () => import("@/messages/ar.json").then((module) => module.default),
  en: () => import("@/messages/en.json").then((module) => module.default),
} as const;

export async function getDictionary(locale: string) {
  const safeLocale = isLocale(locale) ? locale : defaultLocale;
  return dictionaries[safeLocale]();
}

export function getDirection(locale: Locale) {
  return locale === "ar" ? "rtl" : "ltr";
}

export function getLanguageLabel(locale: Locale) {
  return locale === "ar" ? "العربية" : "English";
}
