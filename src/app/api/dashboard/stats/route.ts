import { NextRequest, NextResponse } from "next/server";
import { requireAuth, verifyHouseOwnership } from "@/lib/auth/session";
import prisma from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const url = new URL(req.url);
  const houseId = url.searchParams.get("houseId");

  if (!houseId) {
    return NextResponse.json({ success: false, message: "houseId is required" }, { status: 400 });
  }

  const house = await verifyHouseOwnership(houseId, auth.user.userId);
  if (!house) {
    return NextResponse.json({ success: false, message: "House not found or unauthorized" }, { status: 404 });
  }

  try {
    const now = new Date();

    // Start of Today & End of Today
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // Start of Month & End of Month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Start of Year & End of Year
    const startOfYear = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
    const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

    const baseWhere = {
      houseId,
      userId: auth.user.userId,
      deletedAt: null,
    };

    // Parallel optimized queries
    const [
      totalAgg,
      todayAgg,
      monthAgg,
      yearAgg,
      materialAgg,
      labourAgg,
      allExpenses,
      recentExpenses,
    ] = await Promise.all([
      // 1. Total spent & balances
      prisma.expense.aggregate({
        where: baseWhere,
        _sum: {
          totalAmount: true,
          paidAmount: true,
          balanceAmount: true,
        },
        _count: true,
      }),

      // 2. Today's expense
      prisma.expense.aggregate({
        where: {
          ...baseWhere,
          expenseDate: { gte: startOfToday, lte: endOfToday },
        },
        _sum: { totalAmount: true },
      }),

      // 3. This month's expense
      prisma.expense.aggregate({
        where: {
          ...baseWhere,
          expenseDate: { gte: startOfMonth, lte: endOfMonth },
        },
        _sum: { totalAmount: true },
      }),

      // 4. This year's expense
      prisma.expense.aggregate({
        where: {
          ...baseWhere,
          expenseDate: { gte: startOfYear, lte: endOfYear },
        },
        _sum: { totalAmount: true },
      }),

      // 5. Material expenses
      prisma.expense.aggregate({
        where: { ...baseWhere, expenseType: "MATERIAL" },
        _sum: { totalAmount: true },
      }),

      // 6. Labour expenses
      prisma.expense.aggregate({
        where: { ...baseWhere, expenseType: "LABOUR" },
        _sum: { totalAmount: true },
      }),

      // 7. All expenses for breakdowns & trend
      prisma.expense.findMany({
        where: baseWhere,
        select: {
          category: true,
          stage: true,
          totalAmount: true,
          expenseDate: true,
          expenseType: true,
        },
      }),

      // 8. Recent transactions
      prisma.expense.findMany({
        where: baseWhere,
        orderBy: { expenseDate: "desc" },
        take: 6,
        select: {
          id: true,
          expenseDate: true,
          itemDescription: true,
          category: true,
          stage: true,
          expenseType: true,
          totalAmount: true,
          paymentMethod: true,
          paymentStatus: true,
          supplierName: true,
          workerName: true,
        },
      }),
    ]);

    const totalSpent = totalAgg._sum.totalAmount || 0;
    const totalBudget = house.estimatedBudget || 0;
    const remainingBudget = Math.max(0, totalBudget - totalSpent);
    const budgetUsedPercent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    const todayExpense = todayAgg._sum.totalAmount || 0;
    const thisMonthExpense = monthAgg._sum.totalAmount || 0;
    const thisYearExpense = yearAgg._sum.totalAmount || 0;
    const materialCost = materialAgg._sum.totalAmount || 0;
    const labourCost = labourAgg._sum.totalAmount || 0;
    const otherCost = Math.max(0, totalSpent - (materialCost + labourCost));
    const pendingPayments = totalAgg._sum.balanceAmount || 0;

    // Category breakdown
    const categoryMap: Record<string, number> = {};
    const stageMap: Record<string, number> = {};

    // Monthly trend (last 6 months)
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyTrendMap: Record<string, number> = {};

    // Initialize past 6 months in order
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`;
      monthlyTrendMap[key] = 0;
    }

    allExpenses.forEach((exp) => {
      // Category
      categoryMap[exp.category] = (categoryMap[exp.category] || 0) + exp.totalAmount;

      // Stage
      stageMap[exp.stage] = (stageMap[exp.stage] || 0) + exp.totalAmount;

      // Month
      const expD = new Date(exp.expenseDate);
      const key = `${monthNames[expD.getMonth()]} ${expD.getFullYear().toString().slice(2)}`;
      if (key in monthlyTrendMap) {
        monthlyTrendMap[key] += exp.totalAmount;
      }
    });

    const categoryBreakdown = Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const stageBreakdown = Object.entries(stageMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const monthlyTrend = Object.entries(monthlyTrendMap).map(([month, amount]) => ({
      month,
      amount,
    }));

    const highestCategory = categoryBreakdown.length > 0 ? categoryBreakdown[0] : null;

    return NextResponse.json({
      success: true,
      data: {
        house: {
          id: house.id,
          name: house.name,
          ownerName: house.ownerName,
          location: house.location,
          totalBudget,
        },
        financials: {
          totalBudget,
          totalSpent,
          remainingBudget,
          budgetUsedPercent: parseFloat(budgetUsedPercent.toFixed(2)),
          todayExpense,
          thisMonthExpense,
          thisYearExpense,
          materialCost,
          labourCost,
          otherCost,
          pendingPayments,
          totalTransactions: totalAgg._count,
          highestCategory,
        },
        categoryBreakdown,
        stageBreakdown,
        monthlyTrend,
        recentExpenses,
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
