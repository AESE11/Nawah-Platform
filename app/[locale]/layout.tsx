import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Inter, Tajawal } from "next/font/google";
import { getDictionary, getDirection } from "@/lib/i18n";
import { locales, type Locale, isLocale } from "@/lib/locale";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import "@/app/globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  variable: "--font-arabic",
  weight: ["400", "500", "700", "800"],
});

export const metadata: Metadata = {
  title: "Arabic Learning Platform",
  description: "Bilingual Arabic and English online learning platform foundation",
};

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const direction = getDirection(locale as Locale);
  const dictionary = await getDictionary(locale);

  return (
    <html lang={locale} dir={direction} suppressHydrationWarning>
      <body className={`${inter.variable} ${tajawal.variable} min-h-screen bg-slate-50 text-slate-900 antialiased`}>
        <div className="min-h-screen">
          <SiteHeader locale={locale as Locale} dictionary={dictionary} />
          <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
          <SiteFooter locale={locale as Locale} dictionary={dictionary} />
        </div>
      </body>
    </html>
  );
}
