import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import prisma from "@/lib/db/prisma";
import { logAuditEvent } from "@/lib/services/audit";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { id } = await params;

  try {
    const expense = await prisma.expense.findFirst({
      where: {
        id,
        userId: auth.user.userId,
        deletedAt: null,
      },
    });

    if (!expense) {
      return NextResponse.json({ success: false, message: "Contract expense not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: expense });
  } catch (error) {
    console.error("Get contract expense error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { id } = await params;

  try {
    const existing = await prisma.expense.findFirst({
      where: { id, userId: auth.user.userId, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json({ success: false, message: "Contract expense not found" }, { status: 404 });
    }

    const body = await req.json();

    const totalAmount = body.totalAmount !== undefined ? Number(body.totalAmount) : existing.totalAmount;
    const paidAmount = body.paidAmount !== undefined ? Number(body.paidAmount) : existing.paidAmount;
    const balanceAmount = Math.max(0, totalAmount - paidAmount);
    const paymentStatus =
      paidAmount >= totalAmount ? "PAID" : paidAmount > 0 ? "PARTIAL" : "UNPAID";

    const updated = await prisma.expense.update({
      where: { id },
      data: {
        expenseDate: body.expenseDate ? new Date(body.expenseDate) : existing.expenseDate,
        expenseType: "CONTRACTOR",
        category: body.category ?? existing.category,
        stage: body.stage ?? existing.stage,
        itemDescription: body.itemDescription ?? existing.itemDescription,
        contractorName: body.contractorName ?? existing.contractorName,
        phoneNumber: body.phoneNumber !== undefined ? body.phoneNumber : existing.phoneNumber,
        totalAmount,
        paidAmount,
        balanceAmount,
        paymentStatus,
        paymentMethod: body.paymentMethod ?? existing.paymentMethod,
        notes: body.notes !== undefined ? body.notes : existing.notes,
        quantity: 1,
        unit: "Contract",
        unitPrice: totalAmount,
      },
    });

    await logAuditEvent({
      userId: auth.user.userId,
      userEmail: auth.user.email,
      action: "EXPENSE_UPDATED",
      resource: "Expense",
      resourceId: id,
      metadata: {
        totalAmount,
        contractorName: updated.contractorName,
        description: updated.itemDescription,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Contract expense updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Update contract expense error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { id } = await params;

  try {
    const existing = await prisma.expense.findFirst({
      where: { id, userId: auth.user.userId, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json({ success: false, message: "Contract expense not found" }, { status: 404 });
    }

    // Soft delete
    await prisma.expense.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await logAuditEvent({
      userId: auth.user.userId,
      userEmail: auth.user.email,
      action: "EXPENSE_DELETED",
      resource: "Expense",
      resourceId: id,
      metadata: {
        amount: existing.totalAmount,
        contractorName: existing.contractorName,
        description: existing.itemDescription,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Contract expense deleted successfully",
    });
  } catch (error) {
    console.error("Delete contract expense error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
