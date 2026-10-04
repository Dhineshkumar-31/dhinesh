import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import prisma from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const url = new URL(req.url);
  const search = url.searchParams.get("search") || "";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { username: { contains: search } },
      { email: { contains: search } },
    ];
  }

  try {
    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        _count: {
          select: {
            houses: { where: { deletedAt: null } },
            expenses: { where: { deletedAt: null } },
          },
        },
      },
    });

    // Compute total expense amount per user
    const userExpenses = await prisma.expense.groupBy({
      by: ["userId"],
      where: { deletedAt: null },
      _sum: { totalAmount: true },
    });

    const expenseMap: Record<string, number> = {};
    userExpenses.forEach((ue) => {
      expenseMap[ue.userId] = ue._sum.totalAmount || 0;
    });

    const enrichedUsers = users.map((u) => ({
      ...u,
      totalExpensesAmount: expenseMap[u.id] || 0,
      houseCount: u._count.houses,
      expenseCount: u._count.expenses,
    }));

    return NextResponse.json({ success: true, data: enrichedUsers });
  } catch (error) {
    console.error("Admin users list error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
