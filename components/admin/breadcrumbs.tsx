import Link from "next/link";

export function AdminBreadcrumbs({
  locale,
  items,
}: {
  locale: string;
  items: Array<{ label: string; href?: string }>;
}) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-2 text-sm text-slate-600">
      <Link href={`/${locale}/admin`} className="font-medium text-slate-700 hover:text-slate-900">
        Admin
      </Link>
      {items.map((item) => (
        <div key={`${item.label}-${item.href ?? "current"}`} className="flex items-center gap-2">
          <span aria-hidden="true">/</span>
          {item.href ? (
            <Link href={`/${locale}${item.href}`} className="hover:text-slate-900">
              {item.label}
            </Link>
          ) : (
            <span className="text-slate-900">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}
