"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Locale } from "@/lib/locale";

export function LoginForm({
  locale,
  dictionary,
}: {
  locale: Locale;
  dictionary: {
    auth: Record<string, string>;
    forms: Record<string, string>;
  };
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setIsSubmitting(false);

    if (result?.error) {
      setError(locale === "ar" ? "البريد الإلكتروني أو كلمة المرور غير صحيحة." : "Invalid email or password.");
      return;
    }

    router.push(`/${locale}/dashboard`);
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 md:p-8">
      <h1 className="text-2xl font-bold text-slate-900">{dictionary.auth.loginTitle}</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{dictionary.auth.email}</Label>
          <Input
            id="email"
            type="email"
            placeholder={dictionary.forms.emailPlaceholder}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="min-w-0"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">{dictionary.auth.password}</Label>
          <Input
            id="password"
            type="password"
            placeholder={dictionary.forms.passwordPlaceholder}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="min-w-0"
          />
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button type="submit" className="w-full min-h-11" disabled={isSubmitting}>
          {isSubmitting ? dictionary.auth.submit : dictionary.auth.loginButton}
        </Button>
      </form>
    </div>
  );
}
