import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import prisma from "@/lib/db/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await params;

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        preferredLanguage: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        houses: {
          where: { deletedAt: null },
          include: {
            _count: {
              select: { expenses: { where: { deletedAt: null } } },
            },
          },
        },
        auditLogs: {
          take: 10,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    // Aggregate user expenses breakdown
    const expenses = await prisma.expense.findMany({
      where: { userId: id, deletedAt: null },
      select: { expenseType: true, totalAmount: true },
    });

    let total = 0;
    let material = 0;
    let labour = 0;
    let other = 0;

    expenses.forEach((e) => {
      total += e.totalAmount;
      if (e.expenseType === "MATERIAL") material += e.totalAmount;
      else if (e.expenseType === "LABOUR") labour += e.totalAmount;
      else other += e.totalAmount;
    });

    return NextResponse.json({
      success: true,
      data: {
        user,
        expensesSummary: {
          total,
          material,
          labour,
          other,
          count: expenses.length,
        },
      },
    });
  } catch (error) {
    console.error("Admin user detail error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
