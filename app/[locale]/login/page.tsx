import { LoginForm } from "@/components/auth/login-form";
import { getDictionary } from "@/lib/i18n";
import { isLocale } from "@/lib/locale";

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ callbackUrl?: string }>;
}) {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : "ar";
  const dictionary = await getDictionary(safeLocale);
  const requestedCallbackUrl = (await searchParams)?.callbackUrl;
  const callbackUrl = requestedCallbackUrl?.startsWith(`/${safeLocale}/`) && !requestedCallbackUrl.startsWith("//")
    ? requestedCallbackUrl
    : `/${safeLocale}/dashboard`;

  return <LoginForm locale={safeLocale} dictionary={dictionary} callbackUrl={callbackUrl} />;
}
