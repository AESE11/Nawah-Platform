"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { locales, type Locale } from "@/lib/locale";

export function LanguageSwitcher() {
  const pathname = usePathname();

  const switchLocale = (nextLocale: Locale) => {
    const segments = pathname.split("/").filter(Boolean);
    const currentLocale = segments[0] && locales.includes(segments[0] as Locale) ? segments[0] : null;

    if (currentLocale) {
      segments.shift();
    }

    const nextPath = `/${nextLocale}${segments.length ? `/${segments.join("/")}` : ""}`;
    return nextPath;
  };

  return (
    <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white p-1">
      {locales.map((locale) => (
        <Link
          key={locale}
          href={switchLocale(locale)}
          className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
            pathname.startsWith(`/${locale}`)
              ? "bg-slate-900 text-white"
              : "text-slate-700 hover:bg-slate-100"
          }`}
          aria-label={`Switch language to ${locale === "ar" ? "Arabic" : "English"}`}
        >
          {locale === "ar" ? "العربية" : "English"}
        </Link>
      ))}
    </div>
  );
}
