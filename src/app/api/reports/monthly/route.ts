import { NextRequest, NextResponse } from "next/server";
import { requireAuth, verifyHouseOwnership } from "@/lib/auth/session";
import prisma from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const url = new URL(req.url);
  const houseId = url.searchParams.get("houseId");
  const now = new Date();
  const year = parseInt(url.searchParams.get("year") || now.getFullYear().toString());
  const month = parseInt(url.searchParams.get("month") || (now.getMonth() + 1).toString()); // 1-12

  if (!houseId) {
    return NextResponse.json({ success: false, message: "houseId is required" }, { status: 400 });
  }

  const house = await verifyHouseOwnership(houseId, auth.user.userId);
  if (!house) {
    return NextResponse.json({ success: false, message: "House not found" }, { status: 404 });
  }

  try {
    const startOfMonth = new Date(year, month - 1, 1, 0, 0, 0);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const expenses = await prisma.expense.findMany({
      where: {
        houseId,
        userId: auth.user.userId,
        deletedAt: null,
        expenseDate: { gte: startOfMonth, lte: endOfMonth },
      },
      orderBy: { expenseDate: "asc" },
    });

    let total = 0;
    let material = 0;
    let labour = 0;
    let contractor = 0;
    let equipment = 0;
    let transportation = 0;
    let other = 0;

    const categoryBreakdown: Record<string, number> = {};
    const stageBreakdown: Record<string, number> = {};
    const dailyTrendMap: Record<number, number> = {};

    const daysInMonth = new Date(year, month, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      dailyTrendMap[day] = 0;
    }

    expenses.forEach((e) => {
      total += e.totalAmount;
      if (e.expenseType === "MATERIAL") material += e.totalAmount;
      else if (e.expenseType === "LABOUR") labour += e.totalAmount;
      else if (e.expenseType === "CONTRACTOR") contractor += e.totalAmount;
      else if (e.expenseType === "EQUIPMENT") equipment += e.totalAmount;
      else if (e.expenseType === "TRANSPORTATION") transportation += e.totalAmount;
      else other += e.totalAmount;

      categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + e.totalAmount;
      stageBreakdown[e.stage] = (stageBreakdown[e.stage] || 0) + e.totalAmount;

      const day = new Date(e.expenseDate).getDate();
      dailyTrendMap[day] = (dailyTrendMap[day] || 0) + e.totalAmount;
    });

    const dailyTrend = Object.entries(dailyTrendMap).map(([day, amount]) => ({
      day: parseInt(day),
      amount,
    }));

    return NextResponse.json({
      success: true,
      data: {
        year,
        month,
        house: {
          id: house.id,
          name: house.name,
          ownerName: house.ownerName,
          location: house.location,
          totalBudget: house.estimatedBudget,
        },
        summary: {
          total,
          material,
          labour,
          contractor,
          equipment,
          transportation,
          other,
          transactionCount: expenses.length,
        },
        categoryBreakdown: Object.entries(categoryBreakdown).map(([name, amount]) => ({ name, amount })),
        stageBreakdown: Object.entries(stageBreakdown).map(([name, amount]) => ({ name, amount })),
        dailyTrend,
        expenses,
      },
    });
  } catch (error) {
    console.error("Monthly report error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
