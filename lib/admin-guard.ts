export type AdminSessionShape = {
  user?: {
    role?: string | null;
  } | null;
} | null | undefined;

export function isAdminSession(session: AdminSessionShape) {
  return Boolean(session?.user && session.user.role === "ADMIN");
}

export function canAccessAdminArea(session: AdminSessionShape) {
  return isAdminSession(session);
}
