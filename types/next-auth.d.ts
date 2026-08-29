import type { DefaultSession } from "next-auth";

type AuthRole = "STUDENT" | "ADMIN";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: AuthRole;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: AuthRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: AuthRole;
    id?: string;
  }
}
