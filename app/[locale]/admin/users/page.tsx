import { Card } from "@/components/ui/card";
import { getAdminUsers } from "@/lib/services/admin-service";
import { isLocale } from "@/lib/locale";

export default async function AdminUsersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : "ar";
  const users = await getAdminUsers();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">
        {safeLocale === "ar" ? "المستخدمون" : "Users"}
      </h1>

      <div className="space-y-4">
        {users.map((user) => (
          <Card key={user.id} className="p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-lg font-semibold text-slate-900">{user.name ?? user.email}</p>
                <p className="text-sm text-slate-600">{user.email}</p>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                  {user.role}
                </span>
                <span>{safeLocale === "ar" ? `اشتراكات: ${user._count.enrollments}` : `Enrollments: ${user._count.enrollments}`}</span>
                <span>{safeLocale === "ar" ? `مدفوعات: ${user._count.payments}` : `Payments: ${user._count.payments}`}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
