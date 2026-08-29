import { redirect } from "next/navigation";
import { getAuthSession, type AuthRole } from "@/lib/auth";

export async function requireAuthenticatedUser(locale = "ar") {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  return session.user;
}

export async function requireUserWithRole(role: AuthRole, locale = "ar") {
  const user = await requireAuthenticatedUser(locale);

  if (user.role !== role) {
    redirect(`/${locale}/login`);
  }

  return user;
}

export async function requireStudent(locale = "ar") {
  return requireUserWithRole("STUDENT", locale);
}

export async function requireAdmin(locale = "ar") {
  return requireUserWithRole("ADMIN", locale);
}
