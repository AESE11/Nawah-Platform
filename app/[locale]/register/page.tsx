import { RegisterForm } from "@/components/auth/register-form";
import { getDictionary } from "@/lib/i18n";
import { isLocale } from "@/lib/locale";

export default async function RegisterPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : "ar";
  const dictionary = await getDictionary(safeLocale);

  return <RegisterForm locale={safeLocale} dictionary={dictionary} />;
}
