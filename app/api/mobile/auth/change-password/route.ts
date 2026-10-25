import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyMobileAuthToken } from "@/lib/mobile/auth-token";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(8).max(128),
});

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Authentication required." }, { status: 401 });
    }

    const token = authorization.slice("Bearer ".length).trim();
    if (!token) {
      return NextResponse.json({ message: "Authentication required." }, { status: 401 });
    }

    const { userId, role } = await verifyMobileAuthToken(token);
    const body = await request.json();
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "كلمة المرور الجديدة يجب أن تكون من 8 إلى 128 حرفًا، مع إدخال كلمة المرور الحالية." },
        { status: 400 },
      );
    }

    const { currentPassword, newPassword } = parsed.data;
    if (currentPassword === newPassword) {
      return NextResponse.json(
        { message: "اختر كلمة مرور جديدة مختلفة عن الحالية." },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, passwordHash: true },
    });

    if (!user || user.role !== role) {
      return NextResponse.json({ message: "Authentication token is no longer valid." }, { status: 401 });
    }
    if (!user.passwordHash) {
      return NextResponse.json(
        { message: "لا يمكن تغيير كلمة المرور لهذا الحساب بالطريقة الحالية. تواصل مع الإدارة." },
        { status: 400 },
      );
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      return NextResponse.json({ message: "كلمة المرور الحالية غير صحيحة." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return NextResponse.json({ message: "تم تغيير كلمة المرور بنجاح." });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
    }
    return NextResponse.json({ message: "Invalid or expired authentication token." }, { status: 401 });
  }
}
