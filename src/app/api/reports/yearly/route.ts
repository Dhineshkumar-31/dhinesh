import { NextRequest, NextResponse } from "next/server";
import { requireAuth, verifyHouseOwnership } from "@/lib/auth/session";
import prisma from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const url = new URL(req.url);
  const houseId = url.searchParams.get("houseId");
  const year = parseInt(url.searchParams.get("year") || new Date().getFullYear().toString());

  if (!houseId) {
    return NextResponse.json({ success: false, message: "houseId is required" }, { status: 400 });
  }

  const house = await verifyHouseOwnership(houseId, auth.user.userId);
  if (!house) {
    return NextResponse.json({ success: false, message: "House not found" }, { status: 404 });
  }

  try {
    const startOfYear = new Date(year, 0, 1, 0, 0, 0);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

    const expenses = await prisma.expense.findMany({
      where: {
        houseId,
        userId: auth.user.userId,
        deletedAt: null,
        expenseDate: { gte: startOfYear, lte: endOfYear },
      },
      orderBy: { expenseDate: "asc" },
    });

    let total = 0;
    const categoryBreakdown: Record<string, number> = {};
    const stageBreakdown: Record<string, number> = {};
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyMap: Record<number, number> = {};

    for (let m = 0; m < 12; m++) {
      monthlyMap[m] = 0;
    }

    expenses.forEach((e) => {
      total += e.totalAmount;
      categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + e.totalAmount;
      stageBreakdown[e.stage] = (stageBreakdown[e.stage] || 0) + e.totalAmount;

      const m = new Date(e.expenseDate).getMonth();
      monthlyMap[m] = (monthlyMap[m] || 0) + e.totalAmount;
    });

    const monthlyBreakdown = monthNames.map((month, idx) => ({
      month,
      amount: monthlyMap[idx],
    }));

    // Find highest spending month
    let highestMonth = { month: "None", amount: 0 };
    monthlyBreakdown.forEach((m) => {
      if (m.amount > highestMonth.amount) {
        highestMonth = m;
      }
    });

    // Find highest category
    const catList = Object.entries(categoryBreakdown).map(([name, amount]) => ({ name, amount }));
    catList.sort((a, b) => b.amount - a.amount);
    const highestCategory = catList.length > 0 ? catList[0] : { name: "None", amount: 0 };

    return NextResponse.json({
      success: true,
      data: {
        year,
        house: {
          id: house.id,
          name: house.name,
          ownerName: house.ownerName,
          location: house.location,
          totalBudget: house.estimatedBudget,
        },
        financials: {
          totalYearlySpent: total,
          totalBudget: house.estimatedBudget,
          remainingBudget: Math.max(0, house.estimatedBudget - total),
          highestMonth,
          highestCategory,
          transactionCount: expenses.length,
        },
        monthlyBreakdown,
        categoryBreakdown: catList,
        stageBreakdown: Object.entries(stageBreakdown).map(([name, amount]) => ({ name, amount })),
      },
    });
  } catch (error) {
    console.error("Yearly report error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
