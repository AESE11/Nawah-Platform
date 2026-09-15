import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getAuthSession } from "@/lib/auth";
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
  const session = await getAuthSession();
  const getStartedHref = session?.user?.role === "ADMIN"
    ? `/${safeLocale}/admin`
    : session?.user?.role === "STUDENT"
      ? `/${safeLocale}/dashboard`
      : `/${safeLocale}/register`;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 md:p-8 lg:p-10">
      <div className="max-w-3xl space-y-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700 sm:text-sm">
          {safeLocale === "ar" ? "AR / EN" : "AR / EN"}
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
          {dictionary.home.title}
        </h1>
        <p className="text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">{dictionary.home.subtitle}</p>
        <div className="flex flex-wrap gap-3">
          <Link href={`/${safeLocale}/courses`}>
            <Button className="min-h-11">{dictionary.home.ctaPrimary}</Button>
          </Link>
          <Link href={getStartedHref}>
            <Button variant="outline" className="min-h-11">{dictionary.home.ctaSecondary}</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
