import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createMobileAuthToken } from "@/lib/mobile/auth-token";
import { getClientIp } from "@/lib/security/client-ip";
import {
  DUMMY_PASSWORD_HASH,
  INVALID_LOGIN_MESSAGE,
} from "@/lib/security/login-credentials";
import { checkLoginRateLimit } from "@/lib/security/rate-limit";

const noStoreHeaders = { "Cache-Control": "no-store" };

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1).max(128),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Please provide a valid email and password." },
        { status: 400, headers: noStoreHeaders },
      );
    }

    const { email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase();
    const clientIp = getClientIp(request);

    if (!clientIp) {
      console.error("Mobile login unavailable: trusted client IP missing.");
      return NextResponse.json(
        { message: "Login is temporarily unavailable." },
        { status: 503, headers: noStoreHeaders },
      );
    }

    let rateLimit: { success: boolean; retryAfter: number };

    try {
      rateLimit = await checkLoginRateLimit(clientIp, normalizedEmail);
    } catch {
      console.error("Mobile login unavailable: rate limiter failed.");
      return NextResponse.json(
        { message: "Login is temporarily unavailable." },
        { status: 503, headers: noStoreHeaders },
      );
    }

    if (!rateLimit.success) {
      return NextResponse.json(
        { message: INVALID_LOGIN_MESSAGE },
        {
          status: 429,
          headers: {
            ...noStoreHeaders,
            "Retry-After": String(rateLimit.retryAfter),
          },
        },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
        role: true,
      },
    });

    const isValidPassword = await bcrypt.compare(
      password,
      user?.passwordHash ?? DUMMY_PASSWORD_HASH,
    );

    if (!user || !user.passwordHash || !isValidPassword) {
      return NextResponse.json(
        { message: INVALID_LOGIN_MESSAGE },
        { status: 401, headers: noStoreHeaders },
      );
    }

    const token = await createMobileAuthToken({
      userId: user.id,
      role: user.role,
      passwordHash: user.passwordHash,
    });

    return NextResponse.json(
      {
        token,
        user: {
          id: user.id,
          name: user.name ?? user.email,
          email: user.email,
          role: user.role,
        },
      },
      { headers: noStoreHeaders },
    );
  } catch {
    console.error("Mobile login failed.");

    return NextResponse.json(
      { message: "Login is temporarily unavailable." },
      { status: 503, headers: noStoreHeaders },
    );
  }
}