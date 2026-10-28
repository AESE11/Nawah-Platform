
import { after, NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createPasswordResetToken } from "@/lib/security/password-reset";
import { createPasswordResetDeliveryTask } from "@/lib/security/password-reset-delivery";
import { schedulePasswordResetDelivery } from "@/lib/security/password-reset-request";
import { sendPasswordResetEmail } from "@/lib/email/password-reset";
import { getClientIp } from "@/lib/security/client-ip";
import { checkPasswordResetRateLimit } from "@/lib/security/rate-limit";

const requestSchema = z.object({
  email: z.string().trim().email().max(254),
});

const noStoreHeaders = { "Cache-Control": "no-store" };

export async function POST(request: NextRequest) {
  try {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { message: "بيانات الطلب غير صحيحة." },
        { status: 400, headers: noStoreHeaders },
      );
    }

    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "يرجى إدخال بريد إلكتروني صحيح." },
        { status: 400, headers: noStoreHeaders },
      );
    }

    const ip = getClientIp(request);

    if (!ip) {
      console.error("Password reset unavailable: trusted client IP missing.");
      return NextResponse.json(
        { message: "الخدمة غير متاحة حاليًا. حاول مرة أخرى لاحقًا." },
        { status: 503, headers: noStoreHeaders },
      );
    }

    const email = parsed.data.email.toLowerCase();

    let rateLimit: { success: boolean; retryAfter: number };

    try {
      rateLimit = await checkPasswordResetRateLimit(ip, email);
    } catch {
      console.error("Password reset unavailable: rate limiter failed.");
      return NextResponse.json(
        { message: "الخدمة غير متاحة حاليًا. حاول مرة أخرى لاحقًا." },
        { status: 503, headers: noStoreHeaders },
      );
    }

    if (!rateLimit.success) {
      return NextResponse.json(
        { message: "لقد تجاوزت عدد المحاولات المسموح بها. حاول مرة أخرى لاحقًا." },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfter),
            ...noStoreHeaders,
          },
        },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, passwordHash: true },
    });

    const response = schedulePasswordResetDelivery(
      user,
      (task) => after(task),
      (recipient) =>
        createPasswordResetDeliveryTask(recipient, {
          baseUrl: process.env.APP_BASE_URL,
          createToken: createPasswordResetToken,
          persistToken: async (userId, tokenHash, expiresAt) => {
            await prisma.$transaction([
              prisma.passwordResetToken.deleteMany({
                where: { userId },
              }),
              prisma.passwordResetToken.create({
                data: { userId, tokenHash, expiresAt },
              }),
            ]);
          },
          deleteToken: async (tokenHash) => {
            await prisma.passwordResetToken.deleteMany({
              where: { tokenHash },
            });
          },
          sendEmail: sendPasswordResetEmail,
          logError: (message) => console.error(message),
        })(),
      () => console.error("Password reset delivery could not be scheduled."),
    );

    return NextResponse.json(response.body, {
      status: response.status,
      headers: response.headers,
    });
  } catch {
    console.error("Password reset request failed.");
    return NextResponse.json(
      { message: "تعذر معالجة الطلب حاليًا. حاول مرة أخرى لاحقًا." },
      { status: 500, headers: noStoreHeaders },
    );
  }
}
