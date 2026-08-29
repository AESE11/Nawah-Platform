import Link from "next/link";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import { type Locale } from "@/lib/locale";

type TranslationDictionary = {
  common?: Record<string, string>;
  layout?: Record<string, string>;
};

export function SiteHeader({ locale, dictionary }: { locale: Locale; dictionary: TranslationDictionary }) {
  const navItems = [
    { href: `/${locale}`, label: dictionary.common?.home ?? "Home" },
    { href: `/${locale}/courses`, label: dictionary.common?.courses ?? "Courses" },
    { href: `/${locale}/dashboard`, label: dictionary.common?.dashboard ?? "Dashboard" },
    { href: `/${locale}/contact`, label: dictionary.common?.contact ?? "Contact" },
  ];

  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <Link href={`/${locale}`} className="text-lg font-semibold text-slate-900">
            {dictionary.layout?.brand ?? "Education Platform"}
          </Link>
        </div>

        <nav className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm text-slate-600 transition hover:text-slate-900">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Link href={`/${locale}/login`}>
            <Button variant="outline" size="sm">
              {dictionary.common?.login ?? "Login"}
            </Button>
          </Link>
          <Link href={`/${locale}/register`}>
            <Button size="sm">{dictionary.common?.register ?? "Register"}</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
