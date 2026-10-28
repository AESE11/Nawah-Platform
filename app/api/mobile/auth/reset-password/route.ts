
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClientIp } from "@/lib/security/client-ip";
import { isPasswordResetTokenValid } from "@/lib/security/password-reset";
import { checkPasswordResetCompletionRateLimit } from "@/lib/security/rate-limit";
import { completePasswordReset } from "@/lib/security/password-reset-completion";

const noStoreHeaders = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { message: "أدخل رمز الاستعادة وكلمة مرور من 8 إلى 128 حرفًا." },
        { status: 400, headers: noStoreHeaders },
      );
    }

    const result = await completePasswordReset(body, getClientIp(request), {
      checkRateLimit: checkPasswordResetCompletionRateLimit,
      findToken: (tokenHash) =>
        prisma.passwordResetToken.findUnique({
          where: { tokenHash },
          select: {
            id: true,
            userId: true,
            expiresAt: true,
            usedAt: true,
          },
        }),
      hashPassword: (password) => bcrypt.hash(password, 12),
      consumeAndUpdatePassword: async (tokenHash, passwordHash) => {
        await prisma.$transaction(async (tx) => {
          const now = new Date();
          const resetToken = await tx.passwordResetToken.findUnique({
            where: { tokenHash },
            select: {
              id: true,
              userId: true,
              expiresAt: true,
              usedAt: true,
            },
          });

          if (!resetToken || !isPasswordResetTokenValid(resetToken, now)) {
            throw new Error("INVALID_OR_EXPIRED_RESET_TOKEN");
          }

          const consumed = await tx.passwordResetToken.updateMany({
            where: {
              id: resetToken.id,
              tokenHash,
              usedAt: null,
              expiresAt: { gt: now },
            },
            data: { usedAt: now },
          });

          if (consumed.count !== 1) {
            throw new Error("INVALID_OR_EXPIRED_RESET_TOKEN");
          }

          await tx.user.update({
            where: { id: resetToken.userId },
            data: { passwordHash },
          });

          await tx.passwordResetToken.deleteMany({
            where: {
              userId: resetToken.userId,
              id: { not: resetToken.id },
            },
          });
        });
      },
    });

    if (result.status === "invalid-request") {
      return NextResponse.json(
        { message: "أدخل رمز الاستعادة وكلمة مرور من 8 إلى 128 حرفًا." },
        { status: 400, headers: noStoreHeaders },
      );
    }

    if (result.status === "unavailable") {
      console.error("Password reset completion unavailable.");
      return NextResponse.json(
        { message: "الخدمة غير متاحة حاليًا. حاول مرة أخرى لاحقًا." },
        { status: 503, headers: noStoreHeaders },
      );
    }

    if (result.status === "rate-limited") {
      return NextResponse.json(
        { message: "لقد تجاوزت عدد المحاولات المسموح بها. حاول مرة أخرى لاحقًا." },
        {
          status: 429,
          headers: {
            "Retry-After": String(result.retryAfter),
            ...noStoreHeaders,
          },
        },
      );
    }

    if (result.status === "invalid-token") {
      return NextResponse.json(
        { message: "رابط الاستعادة غير صالح أو انتهت صلاحيته. اطلب رابطًا جديدًا." },
        { status: 400, headers: noStoreHeaders },
      );
    }

    return NextResponse.json(
      { message: "تم تغيير كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن." },
      { headers: noStoreHeaders },
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { message: "بيانات الطلب غير صحيحة." },
        { status: 400, headers: noStoreHeaders },
      );
    }

    console.error("Password reset failed.");
    return NextResponse.json(
      { message: "تعذر تغيير كلمة المرور حاليًا. حاول مرة أخرى لاحقًا." },
      { status: 500, headers: noStoreHeaders },
    );
  }
}
