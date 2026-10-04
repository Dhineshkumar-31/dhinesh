import { NextRequest, NextResponse } from "next/server";
import { requireAuth, verifyHouseOwnership } from "@/lib/auth/session";
import prisma from "@/lib/db/prisma";
import { logAuditEvent } from "@/lib/services/audit";

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

  const search = url.searchParams.get("search")?.trim() || "";
  const stage = url.searchParams.get("stage");
  const paymentStatus = url.searchParams.get("paymentStatus");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    houseId,
    userId: auth.user.userId,
    deletedAt: null,
    OR: [
      { expenseType: "CONTRACTOR" },
      { expenseType: { contains: "CONTRACT" } },
      { expenseType: { contains: "Contract" } },
      { expenseType: { contains: "contract" } },
      { category: { contains: "Contract" } },
      { category: { contains: "contract" } },
      { category: { contains: "Kothanar" } },
      { category: { contains: "kothanar" } },
      { contractorName: { not: null } },
    ],
  };

  if (stage && stage !== "ALL") where.stage = stage;
  if (paymentStatus && paymentStatus !== "ALL") where.paymentStatus = paymentStatus;

  if (search) {
    where.AND = [
      {
        OR: [
          { contractorName: { contains: search } },
          { itemDescription: { contains: search } },
          { phoneNumber: { contains: search } },
          { stage: { contains: search } },
          { category: { contains: search } },
          { notes: { contains: search } },
        ],
      },
    ];
  }

  try {
    const rawEntries = await prisma.expense.findMany({
      where,
      orderBy: { expenseDate: "desc" },
    });

    const entries = rawEntries.map((e) => ({
      ...e,
      contractorName: e.contractorName?.trim() || e.itemDescription || "Contractor / Kothanar",
    }));

    const totalAmount = entries.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
    const paidAmount = entries.reduce((acc, curr) => acc + (curr.paidAmount || 0), 0);
    const balanceAmount = entries.reduce((acc, curr) => acc + (curr.balanceAmount || 0), 0);

    const uniqueContractors = new Set(
      entries
        .map((e) => e.contractorName?.trim())
        .filter((name): name is string => Boolean(name && name.length > 0))
    );

    return NextResponse.json({
      success: true,
      data: {
        entries,
        summary: {
          totalAmount,
          paidAmount,
          balanceAmount,
          contractorCount: uniqueContractors.size,
          recordsCount: entries.length,
        },
      },
    });
  } catch (error) {
    console.error("Contract expenses GET error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json();

    if (!body.houseId) {
      return NextResponse.json({ success: false, message: "houseId is required" }, { status: 400 });
    }

    const house = await verifyHouseOwnership(body.houseId, auth.user.userId);
    if (!house) {
      return NextResponse.json({ success: false, message: "House not found or unauthorized" }, { status: 404 });
    }

    if (!body.contractorName?.trim()) {
      return NextResponse.json({ success: false, message: "Contractor name is required" }, { status: 400 });
    }

    if (!body.itemDescription?.trim()) {
      return NextResponse.json({ success: false, message: "Contract work description is required" }, { status: 400 });
    }

    const totalAmount = parseFloat(body.totalAmount);
    if (isNaN(totalAmount) || totalAmount <= 0) {
      return NextResponse.json({ success: false, message: "Total amount must be greater than zero" }, { status: 400 });
    }

    const paidAmount = body.paidAmount !== undefined && body.paidAmount !== "" ? parseFloat(body.paidAmount) : totalAmount;
    const balanceAmount = Math.max(0, totalAmount - (isNaN(paidAmount) ? 0 : paidAmount));
    const paymentStatus =
      paidAmount >= totalAmount ? "PAID" : paidAmount > 0 ? "PARTIAL" : "UNPAID";

    const entry = await prisma.expense.create({
      data: {
        houseId: body.houseId,
        userId: auth.user.userId,
        expenseDate: body.expenseDate ? new Date(body.expenseDate) : new Date(),
        expenseType: "CONTRACTOR",
        category: body.category || "Contract / Kothanar",
        stage: body.stage || "Structure / Framing",
        itemDescription: body.itemDescription.trim(),
        quantity: 1,
        unit: "Contract",
        unitPrice: totalAmount,
        totalAmount,
        paidAmount: isNaN(paidAmount) ? 0 : paidAmount,
        balanceAmount,
        paymentStatus,
        paymentMethod: body.paymentMethod || "CASH",
        contractorName: body.contractorName.trim(),
        phoneNumber: body.phoneNumber?.trim() || null,
        notes: body.notes?.trim() || null,
      },
    });

    await logAuditEvent({
      userId: auth.user.userId,
      userEmail: auth.user.email,
      action: "EXPENSE_CREATED",
      resource: "Expense",
      resourceId: entry.id,
      metadata: {
        expenseType: "CONTRACTOR",
        contractorName: entry.contractorName,
        totalAmount: entry.totalAmount,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Contract expense recorded successfully",
      data: entry,
    });
  } catch (error) {
    console.error("Create contract expense error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
