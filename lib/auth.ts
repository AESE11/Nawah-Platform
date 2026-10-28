import type { NextAuthOptions, User } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { decode as decodeNextAuthJwt } from "next-auth/jwt";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getClientIpFromHeaders } from "@/lib/security/client-ip";
import { DUMMY_PASSWORD_HASH } from "@/lib/security/login-credentials";
import { checkLoginRateLimit } from "@/lib/security/rate-limit";
import {
  createPasswordAuthVersion,
} from "@/lib/security/password-auth-version";
import { isWebSessionCurrent } from "@/lib/security/web-session";

export type AuthRole = "STUDENT" | "ADMIN";

const AUTH_SECRET = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/ar/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = String(credentials.email).trim().toLowerCase();
        const password = String(credentials.password);
        const clientIp = getClientIpFromHeaders(request.headers);

        if (!clientIp) {
          console.error("Web login unavailable: trusted client IP missing.");
          return null;
        }

        try {
          const rateLimit = await checkLoginRateLimit(clientIp, email);

          if (!rateLimit.success) {
            return null;
          }
        } catch {
          console.error("Web login unavailable: rate limiter failed.");
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email },
        });

        const isValidPassword = await bcrypt.compare(
          password,
          user?.passwordHash ?? DUMMY_PASSWORD_HASH,
        );

        if (!user || !user.passwordHash || !isValidPassword) {
          return null;
        }

        if (!AUTH_SECRET) {
          console.error("Web login unavailable: authentication secret missing.");
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? user.email,
          role: user.role,
          passwordAuthVersion: createPasswordAuthVersion(
            user.passwordHash,
            AUTH_SECRET,
          ),
        } as User;
      },
    }),
  ],
  jwt: {
    async decode(params) {
      const token = await decodeNextAuthJwt(params);

      if (
        !token?.sub ||
        typeof token.passwordAuthVersion !== "string"
      ) {
        return null;
      }

      const user = await prisma.user.findUnique({
        where: { id: token.sub },
        select: { passwordHash: true, role: true },
      });

      if (
        !AUTH_SECRET ||
        !user?.passwordHash ||
        !isWebSessionCurrent(token, user, AUTH_SECRET)
      ) {
        return null;
      }

      return token;
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as User & { role?: AuthRole }).role ?? "STUDENT";
        token.passwordAuthVersion = (
          user as User & { passwordAuthVersion?: string }
        ).passwordAuthVersion;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? "";
        session.user.role = (token.role as AuthRole) ?? "STUDENT";
      }

      return session;
    },
  },
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
};

export async function getAuthSession() {
  return getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getAuthSession();
  return session?.user ?? null;
}
