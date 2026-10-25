import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyMobileAuthToken } from "@/lib/mobile/auth-token";

export async function GET(request: Request) {
  try {
    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { message: "Authentication required." },
        { status: 401 },
      );
    }

    const token = authorization.slice("Bearer ".length).trim();

    if (!token) {
      return NextResponse.json(
        { message: "Authentication required." },
        { status: 401 },
      );
    }

    const { userId, role } = await verifyMobileAuthToken(token);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User account not found." },
        { status: 401 },
      );
    }

    if (user.role !== role) {
      return NextResponse.json(
        { message: "Authentication token is no longer valid." },
        { status: 401 },
      );
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name ?? user.email,
        email: user.email,
        role: user.role,
      },
    });
  } catch {
    return NextResponse.json(
      { message: "Invalid or expired authentication token." },
      { status: 401 },
    );
  }
}