import { NextRequest, NextResponse } from "next/server";
import { requireAuth, verifyHouseOwnership } from "@/lib/auth/session";
import prisma from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const url = new URL(req.url);
  const houseId = url.searchParams.get("houseId");
  const dateStr = url.searchParams.get("date") || new Date().toISOString().split("T")[0];

  if (!houseId) {
    return NextResponse.json({ success: false, message: "houseId is required" }, { status: 400 });
  }

  const house = await verifyHouseOwnership(houseId, auth.user.userId);
  if (!house) {
    return NextResponse.json({ success: false, message: "House not found" }, { status: 404 });
  }

  try {
    const selectedDate = new Date(dateStr);
    const startOfDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 0, 0, 0);
    const endOfDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 23, 59, 59, 999);

    const expenses = await prisma.expense.findMany({
      where: {
        houseId,
        userId: auth.user.userId,
        deletedAt: null,
        expenseDate: { gte: startOfDay, lte: endOfDay },
      },
      orderBy: { createdAt: "desc" },
    });

    let total = 0;
    let material = 0;
    let labour = 0;
    let other = 0;
    const categoryBreakdown: Record<string, number> = {};

    expenses.forEach((e) => {
      total += e.totalAmount;
      if (e.expenseType === "MATERIAL") material += e.totalAmount;
      else if (e.expenseType === "LABOUR") labour += e.totalAmount;
      else other += e.totalAmount;

      categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + e.totalAmount;
    });

    return NextResponse.json({
      success: true,
      data: {
        date: dateStr,
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
          other,
          transactionCount: expenses.length,
        },
        categoryBreakdown: Object.entries(categoryBreakdown).map(([name, amount]) => ({ name, amount })),
        expenses,
      },
    });
  } catch (error) {
    console.error("Daily report error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
