import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getDictionary } from "@/lib/i18n";
import { isLocale } from "@/lib/locale";

export default async function LocaleHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : "ar";
  const dictionary = await getDictionary(safeLocale);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
      <div className="max-w-3xl space-y-5">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">
          {safeLocale === "ar" ? "AR / EN" : "AR / EN"}
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          {dictionary.home.title}
        </h1>
        <p className="text-lg leading-8 text-slate-600">{dictionary.home.subtitle}</p>
        <div className="flex flex-wrap gap-3">
          <Link href={`/${safeLocale}/courses`}>
            <Button>{dictionary.home.ctaPrimary}</Button>
          </Link>
          <Link href={`/${safeLocale}/register`}>
            <Button variant="outline">{dictionary.home.ctaSecondary}</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
