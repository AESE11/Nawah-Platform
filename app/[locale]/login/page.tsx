import { LoginForm } from "@/components/auth/login-form";
import { getDictionary } from "@/lib/i18n";
import { isLocale } from "@/lib/locale";

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : "ar";
  const dictionary = await getDictionary(safeLocale);

  return <LoginForm locale={safeLocale} dictionary={dictionary} />;
}
