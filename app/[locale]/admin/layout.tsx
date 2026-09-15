import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n";
import { isLocale } from "@/lib/locale";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
  },
};

const adminNavigation = [
  { href: "overview", label: "Overview" },
  { href: "courses", label: "Courses" },
  { href: "categories", label: "Categories" },
  { href: "payments", label: "Payments" },
  { href: "payment-methods", label: "Payment methods" },
  { href: "enrollments", label: "Enrollments" },
  { href: "enrollment-requests", label: "Enrollment requests" },
  { href: "students", label: "Students" },
  { href: "users", label: "Users" },
] as const;

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : "ar";
  const session = await getAuthSession();

  if (!session?.user) {
    redirect(`/${safeLocale}/login`);
  }

  if (session.user.role !== "ADMIN") {
    redirect(`/${safeLocale}/login`);
  }

  const dictionary = await getDictionary(safeLocale);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">{dictionary.common.admin}</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              {safeLocale === "ar" ? "لوحة الإدارة" : "Admin dashboard"}
            </h1>
          </div>
          <p className="text-sm text-slate-600">
            {session.user.email}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <nav className="space-y-2">
            {adminNavigation.map((item) => (
              <Link
                key={item.href}
                href={`/${safeLocale}/admin${item.href === "overview" ? "" : `/${item.href}`}`}
                className="block rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
              >
                {safeLocale === "ar"
                  ? item.href === "overview"
                    ? "نظرة عامة"
                    : item.href === "courses"
                      ? "الدورات"
                      : item.href === "categories"
                        ? "الفئات"
                        : item.href === "payments"
                          ? "المدفوعات"
                          : item.href === "payment-methods"
                            ? "طرق الدفع"
                            : item.href === "enrollments"
                              ? "الاشتراكات"
                              : item.href === "enrollment-requests"
                                ? "طلبات الاشتراك"
                                : item.href === "students"
                                  ? "الطلاب"
                              : "المستخدمون"
                  : item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
