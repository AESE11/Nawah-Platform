export function getAdminSeedCredentials(
  environment: Readonly<Record<string, string | undefined>>,
): { email: string; password: string } {
  const email = environment.ADMIN_EMAIL?.trim();
  const password = environment.ADMIN_PASSWORD;

  if (
    !email ||
    !password ||
    password.trim().length < 12 ||
    email === "admin@example.com" ||
    password === "your-admin-password"
  ) {
    throw new Error(
      "Set a non-placeholder ADMIN_EMAIL and an ADMIN_PASSWORD of at least 12 characters.",
    );
  }

  return { email, password };
}
