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
    return NextResponse.json({ success: false, message: "House not found" }, { status: 404 });
  }

  try {
    const [entries, workers] = await Promise.all([
      prisma.labourEntry.findMany({
        where: { houseId, userId: auth.user.userId },
        orderBy: { workDate: "desc" },
      }),
      prisma.labourWorker.findMany({
        where: { houseId, userId: auth.user.userId },
        orderBy: { name: "asc" },
      }),
    ]);

    const totalLabourSpent = entries.reduce((acc, curr) => acc + curr.totalAmount, 0);
    const totalLabourPaid = entries.reduce((acc, curr) => acc + curr.paidAmount, 0);
    const totalLabourBalance = entries.reduce((acc, curr) => acc + curr.balanceAmount, 0);

    return NextResponse.json({
      success: true,
      data: {
        entries,
        workers,
        summary: {
          totalAmount: totalLabourSpent,
          paidAmount: totalLabourPaid,
          balanceAmount: totalLabourBalance,
        },
      },
    });
  } catch (error) {
    console.error("Labour error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json();
    const house = await verifyHouseOwnership(body.houseId, auth.user.userId);
    if (!house) {
      return NextResponse.json({ success: false, message: "House not found" }, { status: 404 });
    }

    const dailyRate = Number(body.dailyRate || 0);
    const numberOfWorkers = Number(body.numberOfWorkers || 1);
    const numberOfDays = Number(body.numberOfDays || 1);
    const totalAmount = body.totalAmount ? Number(body.totalAmount) : dailyRate * numberOfWorkers * numberOfDays;
    const paidAmount = Number(body.paidAmount || 0);
    const balanceAmount = Math.max(0, totalAmount - paidAmount);
    const paymentStatus = paidAmount >= totalAmount ? "PAID" : paidAmount > 0 ? "PARTIAL" : "UNPAID";

    const entry = await prisma.labourEntry.create({
      data: {
        houseId: body.houseId,
        userId: auth.user.userId,
        workerName: body.workerName,
        labourType: body.labourType || "Mason",
        workDate: body.workDate ? new Date(body.workDate) : new Date(),
        numberOfWorkers,
        numberOfDays,
        dailyRate,
        totalAmount,
        paidAmount,
        balanceAmount,
        paymentMethod: body.paymentMethod || "CASH",
        paymentStatus,
        notes: body.notes || null,
      },
    });

    return NextResponse.json({ success: true, message: "Labour entry saved", data: entry });
  } catch (error) {
    console.error("Create labour entry error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
