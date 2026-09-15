"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import { type Locale } from "@/lib/locale";

type TranslationDictionary = {
  common?: Record<string, string>;
  layout?: Record<string, string>;
};

export function SiteHeader({ locale, dictionary }: { locale: Locale; dictionary: TranslationDictionary }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [authenticatedRole, setAuthenticatedRole] = useState<"STUDENT" | "ADMIN" | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      const response = await fetch("/api/auth/session", { cache: "no-store" });
      const session = (await response.json()) as { user?: { role?: "STUDENT" | "ADMIN" } };

      if (isMounted) {
        setAuthenticatedRole(session.user?.role ?? null);
      }
    }

    void loadSession();

    return () => {
      isMounted = false;
    };
  }, []);

  function handleLogout() {
    void signOut({ callbackUrl: "/ar" });
  }

  const isAuthenticated = authenticatedRole !== null;

  const navItems = [
    { href: `/${locale}`, label: dictionary.common?.home ?? "Home" },
    { href: `/${locale}/courses`, label: dictionary.common?.courses ?? "Courses" },
    {
      href: authenticatedRole === "ADMIN" ? `/${locale}/admin` : `/${locale}/dashboard`,
      label: dictionary.common?.dashboard ?? "Dashboard",
    },
    { href: `/${locale}/contact`, label: dictionary.common?.contact ?? "Contact" },
  ];

  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link href={`/${locale}`} className="truncate text-base font-semibold text-slate-900 sm:text-lg">
              {dictionary.layout?.brand ?? "Education Platform"}
            </Link>
          </div>

          <nav className="hidden items-center gap-5 md:flex">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="text-sm text-slate-600 transition hover:text-slate-900">
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>
            <div className="hidden items-center gap-2 md:flex">
              {isAuthenticated ? (
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  {dictionary.common?.logout ?? "Logout"}
                </Button>
              ) : (
                <>
                  <Link href={`/${locale}/login`}>
                    <Button variant="outline" size="sm">
                      {dictionary.common?.login ?? "Login"}
                    </Button>
                  </Link>
                  <Link href={`/${locale}/register`}>
                    <Button size="sm">{dictionary.common?.register ?? "Register"}</Button>
                  </Link>
                </>
              )}
            </div>

            <button
              type="button"
              aria-label={isMenuOpen ? "Close navigation" : "Open navigation"}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 md:hidden"
              onClick={() => setIsMenuOpen((previous) => !previous)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {isMenuOpen ? (
          <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm md:hidden">
            <div className="mb-3 flex justify-center">
              <LanguageSwitcher />
            </div>
            <nav className="space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {isAuthenticated ? (
                <Button variant="outline" className="w-full" onClick={handleLogout}>
                  {dictionary.common?.logout ?? "Logout"}
                </Button>
              ) : (
                <>
                  <Link href={`/${locale}/login`} onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" className="w-full">
                      {dictionary.common?.login ?? "Login"}
                    </Button>
                  </Link>
                  <Link href={`/${locale}/register`} onClick={() => setIsMenuOpen(false)}>
                    <Button className="w-full">{dictionary.common?.register ?? "Register"}</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
