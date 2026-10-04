import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/jwt";
import prisma from "@/lib/db/prisma";

export async function GET() {
  try {
    const userPayload = await getCurrentUser();
    if (!userPayload) {
      return NextResponse.json({ success: false, user: null }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userPayload.userId },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        preferredLanguage: true,
        isActive: true,
        createdAt: true,
        houses: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            ownerName: true,
            location: true,
            estimatedBudget: true,
            startDate: true,
            isDefault: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json({ success: false, user: null, message: "User not found or disabled" }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
