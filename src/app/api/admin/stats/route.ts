import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import prisma from "@/lib/db/prisma";

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    const [
      totalUsers,
      activeUsers,
      totalHouses,
      totalExpensesCount,
      totalValueAgg,
      latestUsers,
      auditLogsCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.house.count({ where: { deletedAt: null } }),
      prisma.expense.count({ where: { deletedAt: null } }),
      prisma.expense.aggregate({
        where: { deletedAt: null },
        _sum: { totalAmount: true },
      }),
      prisma.user.findMany({
        take: 6,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          lastLogin: true,
          _count: {
            select: { houses: true, expenses: true },
          },
        },
      }),
      prisma.auditLog.count(),
    ]);

    // Monthly registration stats for chart
    const users = await prisma.user.findMany({
      select: { createdAt: true },
    });

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const regTrendMap: Record<string, number> = {};

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`;
      regTrendMap[key] = 0;
    }

    users.forEach((u) => {
      const d = new Date(u.createdAt);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`;
      if (key in regTrendMap) {
        regTrendMap[key] += 1;
      }
    });

    const registrationTrend = Object.entries(regTrendMap).map(([month, count]) => ({
      month,
      count,
    }));

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        totalHouses,
        totalExpensesCount,
        totalTrackedValue: totalValueAgg._sum.totalAmount || 0,
        auditLogsCount,
        registrationTrend,
        latestUsers,
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
