
import { NextResponse } from "next/server";
import { getMobileAuth } from "@/lib/mobile/auth";
import { getPaymentMethods } from "@/lib/services/payment-service";

export async function GET(request: Request) {
  const auth = await getMobileAuth(request);

  if (!auth) {
    return NextResponse.json(
      { message: "Authentication required." },
      { status: 401 },
    );
  }

  if (auth.role !== "STUDENT") {
    return NextResponse.json(
      { message: "Student access required." },
      { status: 403 },
    );
  }

  try {
    const methods = await getPaymentMethods();

    return NextResponse.json({
      paymentMethods: methods.map((method) => ({
        id: method.id,
        nameAr: method.nameAr,
        nameEn: method.nameEn,
        instructionsAr: method.instructionsAr,
        instructionsEn: method.instructionsEn,
        accountDetailsAr: method.accountDetailsAr,
        accountDetailsEn: method.accountDetailsEn,
        enabled: method.enabled,
        sortOrder: method.sortOrder,
      })),
    });
  } catch (error) {
    console.error("Mobile payment methods failed:", error);

    return NextResponse.json(
      { message: "Failed to load payment methods." },
      { status: 500 },
    );
  }
}
