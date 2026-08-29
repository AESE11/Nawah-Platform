import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { getAuthSession } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n";
import { isLocale } from "@/lib/locale";

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : "ar";
  const session = await getAuthSession();

  if (!session?.user) {
    redirect(`/${safeLocale}/login`);
  }

  if (session.user.role !== "STUDENT") {
    redirect(`/${safeLocale}/login`);
  }

  const dictionary = await getDictionary(safeLocale);

  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <Card className="p-8">
        <h1 className="text-3xl font-bold text-slate-900">{dictionary.common.dashboard}</h1>
        <p className="mt-3 text-slate-600">
          {safeLocale === "ar" ? "مرحباً بك في لوحة الطالب. سيتم بناء سير العمل الخاص بالدورات لاحقاً." : "Welcome to your student dashboard. Course workflows will be added in the next phase."}
        </p>
      </Card>
      <Card className="p-8">
        <h2 className="text-xl font-semibold text-slate-900">{safeLocale === "ar" ? "حالة الحساب" : "Account status"}</h2>
        <p className="mt-3 text-slate-600">{session.user.email}</p>
      </Card>
    </section>
  );
}
