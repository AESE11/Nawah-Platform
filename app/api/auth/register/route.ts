
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "من فضلك أدخل اسمك الرباعي.")
    .max(100, "الاسم طويل جدًا.")
    .refine(
      (value) => value.split(/\s+/).filter(Boolean).length >= 4,
      "يجب إدخال الاسم الرباعي على الأقل (أربعة أسماء)."
    ),
  email: z.string().trim().email("أدخل بريدًا إلكترونيًا صحيحًا."),
  password: z
    .string()
    .min(8, "كلمة المرور يجب ألا تقل عن 8 أحرف.")
    .max(128, "كلمة المرور طويلة جدًا."),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? "راجع البيانات المدخلة." },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;
    const normalizedName = name.split(/\s+/).filter(Boolean).join(" ");
    const normalizedEmail = email.toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "يوجد حساب مسجل بهذا البريد الإلكتروني بالفعل." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.user.create({
      data: {
        name: normalizedName,
        email: normalizedEmail,
        passwordHash,
        role: "STUDENT",
      },
    });

    return NextResponse.json(
      { message: "تم إنشاء الحساب بنجاح." },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration failed:", error);
    return NextResponse.json(
      { message: "تعذر إنشاء الحساب. حاول مرة أخرى." },
      { status: 500 }
    );
  }
}
