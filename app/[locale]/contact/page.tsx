import { Card } from "@/components/ui/card";
import { getDictionary } from "@/lib/i18n";
import { isLocale } from "@/lib/locale";

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : "ar";
  const dictionary = await getDictionary(safeLocale);

  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <Card className="p-8">
        <h1 className="text-3xl font-bold text-slate-900">{dictionary.common.contact}</h1>
        <p className="mt-3 text-slate-600">
          {safeLocale === "ar" ? "يمكنك التواصل معنا للاستفسار عن الدورات والدعم الفني." : "You can contact us for course support and inquiries."}
        </p>
      </Card>
      <Card className="p-8">
        <ul className="space-y-3 text-slate-700">
          <li>Email: support@example.com</li>
          <li>Phone: +966 500 000 000</li>
        </ul>
      </Card>
    </section>
  );
}
