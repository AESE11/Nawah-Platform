export const locales = ["ar", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ar";

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function getLocaleFromPath(pathname: string): Locale {
  const maybeLocale = pathname.split("/").filter(Boolean)[0];
  return isLocale(maybeLocale) ? maybeLocale : defaultLocale;
}
