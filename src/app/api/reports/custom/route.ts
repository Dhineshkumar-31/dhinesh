import { NextRequest, NextResponse } from "next/server";
import { requireAuth, verifyHouseOwnership } from "@/lib/auth/session";
import prisma from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const url = new URL(req.url);
  const houseId = url.searchParams.get("houseId");
  const fromStr = url.searchParams.get("from");
  const toStr = url.searchParams.get("to");

  if (!houseId) {
    return NextResponse.json({ success: false, message: "houseId is required" }, { status: 400 });
  }

  const house = await verifyHouseOwnership(houseId, auth.user.userId);
  if (!house) {
    return NextResponse.json({ success: false, message: "House not found" }, { status: 404 });
  }

  if (!fromStr || !toStr) {
    return NextResponse.json({ success: false, message: "from and to dates are required" }, { status: 400 });
  }

  try {
    const fromDate = new Date(fromStr);
    const toDate = new Date(toStr);
    toDate.setHours(23, 59, 59, 999);

    const expenses = await prisma.expense.findMany({
      where: {
        houseId,
        userId: auth.user.userId,
        deletedAt: null,
        expenseDate: { gte: fromDate, lte: toDate },
      },
      orderBy: { expenseDate: "asc" },
    });

    let total = 0;
    let paid = 0;
    let balance = 0;
    const categoryBreakdown: Record<string, number> = {};
    const stageBreakdown: Record<string, number> = {};

    expenses.forEach((e) => {
      total += e.totalAmount;
      paid += e.paidAmount;
      balance += e.balanceAmount;

      categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + e.totalAmount;
      stageBreakdown[e.stage] = (stageBreakdown[e.stage] || 0) + e.totalAmount;
    });

    return NextResponse.json({
      success: true,
      data: {
        from: fromStr,
        to: toStr,
        house: {
          id: house.id,
          name: house.name,
          ownerName: house.ownerName,
          location: house.location,
          totalBudget: house.estimatedBudget,
        },
        summary: {
          totalAmount: total,
          paidAmount: paid,
          balanceAmount: balance,
          transactionCount: expenses.length,
        },
        categoryBreakdown: Object.entries(categoryBreakdown).map(([name, amount]) => ({ name, amount })),
        stageBreakdown: Object.entries(stageBreakdown).map(([name, amount]) => ({ name, amount })),
        expenses,
      },
    });
  } catch (error) {
    console.error("Custom report error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
