import Link from "next/link";
import type { Locale } from "@/lib/locale";

type TranslationDictionary = {
  common?: Record<string, string>;
  layout?: Record<string, string>;
  home?: Record<string, string>;
};

export function SiteFooter({ locale, dictionary }: { locale: Locale; dictionary: TranslationDictionary }) {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <p className="text-base font-semibold text-slate-900">{dictionary.layout?.brand ?? "Education Platform"}</p>
          <p className="mt-1 text-sm text-slate-600">{dictionary.home?.subtitle ?? "Modern bilingual learning experience"}</p>
        </div>
        <nav className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
          <Link href={`/${locale}/courses`}>{dictionary.common?.courses ?? "Courses"}</Link>
          <Link href={`/${locale}/dashboard`}>{dictionary.common?.dashboard ?? "Dashboard"}</Link>
          <Link href={`/${locale}/contact`}>{dictionary.common?.contact ?? "Contact"}</Link>
        </nav>
      </div>
    </footer>
  );
}
