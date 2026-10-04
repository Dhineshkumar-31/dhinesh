import { NextRequest, NextResponse } from "next/server";
import { requireAuth, verifyHouseOwnership } from "@/lib/auth/session";
import prisma from "@/lib/db/prisma";
import { logAuditEvent } from "@/lib/services/audit";
import { z } from "zod";

const expenseSchema = z.object({
  houseId: z.string().min(1, "House ID is required"),
  expenseDate: z.string().min(1, "Expense date is required"),
  expenseType: z.string().default("MATERIAL"),
  category: z.string().min(1, "Category is required"),
  stage: z.string().min(1, "Construction stage is required"),
  itemDescription: z.string().min(1, "Description is required"),
  quantity: z.number().nonnegative().default(1),
  unit: z.string().default("Unit"),
  unitPrice: z.number().nonnegative().default(0),
  totalAmount: z.number().positive("Total amount must be greater than zero"),
  supplierName: z.string().optional().nullable(),
  workerName: z.string().optional().nullable(),
  contractorName: z.string().optional().nullable(),
  phoneNumber: z.string().optional().nullable(),
  paymentMethod: z.string().default("CASH"),
  paidAmount: z.number().nonnegative().default(0),
  balanceAmount: z.number().nonnegative().default(0),
  paymentStatus: z.string().default("PAID"),
  receiptUrl: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

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

  const search = url.searchParams.get("search") || "";
  const type = url.searchParams.get("type");
  const category = url.searchParams.get("category");
  const stage = url.searchParams.get("stage");
  const paymentStatus = url.searchParams.get("paymentStatus");
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");
  const sortBy = url.searchParams.get("sortBy") || "expenseDate";
  const sortOrder = (url.searchParams.get("sortOrder") || "desc") as "asc" | "desc";
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20")));
  const skip = (page - 1) * limit;

  // Build filter clause
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    houseId,
    userId: auth.user.userId,
    deletedAt: null,
  };

  if (type && type !== "ALL") where.expenseType = type;
  if (category && category !== "ALL") where.category = category;
  if (stage && stage !== "ALL") where.stage = stage;
  if (paymentStatus && paymentStatus !== "ALL") where.paymentStatus = paymentStatus;

  if (startDate || endDate) {
    where.expenseDate = {};
    if (startDate) where.expenseDate.gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.expenseDate.lte = end;
    }
  }

  if (search) {
    where.OR = [
      { itemDescription: { contains: search } },
      { supplierName: { contains: search } },
      { workerName: { contains: search } },
      { contractorName: { contains: search } },
      { category: { contains: search } },
      { stage: { contains: search } },
    ];
  }

  try {
    const [totalRecords, expenses, totalSum] = await Promise.all([
      prisma.expense.count({ where }),
      prisma.expense.findMany({
        where,
        orderBy: {
          [sortBy === "amount" ? "totalAmount" : sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      prisma.expense.aggregate({
        where,
        _sum: {
          totalAmount: true,
          paidAmount: true,
          balanceAmount: true,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: expenses,
      pagination: {
        page,
        limit,
        totalRecords,
        totalPages: Math.ceil(totalRecords / limit),
      },
      summary: {
        totalAmount: totalSum._sum.totalAmount || 0,
        paidAmount: totalSum._sum.paidAmount || 0,
        balanceAmount: totalSum._sum.balanceAmount || 0,
      },
    });
  } catch (error) {
    console.error("List expenses error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json();
    const result = expenseSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: "Validation error", errors: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = result.data;
    const house = await verifyHouseOwnership(data.houseId, auth.user.userId);
    if (!house) {
      return NextResponse.json({ success: false, message: "House not found or unauthorized" }, { status: 404 });
    }

    const calculatedBalance = Math.max(0, data.totalAmount - data.paidAmount);
    const calculatedStatus =
      data.paidAmount >= data.totalAmount ? "PAID" : data.paidAmount > 0 ? "PARTIAL" : "UNPAID";

    const expense = await prisma.expense.create({
      data: {
        houseId: data.houseId,
        userId: auth.user.userId,
        expenseDate: new Date(data.expenseDate),
        expenseType: data.expenseType,
        category: data.category,
        stage: data.stage,
        itemDescription: data.itemDescription,
        quantity: data.quantity,
        unit: data.unit,
        unitPrice: data.unitPrice,
        totalAmount: data.totalAmount,
        supplierName: data.supplierName || null,
        workerName: data.workerName || null,
        contractorName:
          data.contractorName ||
          (data.expenseType?.toUpperCase().includes("CONTRACT") ||
           data.category?.toLowerCase().includes("contract") ||
           data.category?.toLowerCase().includes("kothanar")
            ? data.itemDescription || "Contractor"
            : null),
        phoneNumber: data.phoneNumber || null,
        paymentMethod: data.paymentMethod,
        paidAmount: data.paidAmount,
        balanceAmount: calculatedBalance,
        paymentStatus: calculatedStatus,
        receiptUrl: data.receiptUrl || null,
        notes: data.notes || null,
      },
    });

    // If type is MATERIAL, sync to Material table
    if (data.expenseType === "MATERIAL") {
      await prisma.material.create({
        data: {
          houseId: data.houseId,
          userId: auth.user.userId,
          name: data.itemDescription,
          category: data.category,
          quantity: data.quantity,
          unit: data.unit,
          unitPrice: data.unitPrice,
          totalCost: data.totalAmount,
          supplier: data.supplierName || null,
          purchaseDate: new Date(data.expenseDate),
          notes: data.notes || null,
        },
      });
    }

    // If type is LABOUR, sync to LabourEntry
    if (data.expenseType === "LABOUR") {
      await prisma.labourEntry.create({
        data: {
          houseId: data.houseId,
          userId: auth.user.userId,
          workerName: data.workerName || data.itemDescription,
          labourType: data.category,
          workDate: new Date(data.expenseDate),
          numberOfWorkers: Math.max(1, Math.round(data.quantity)),
          numberOfDays: 1,
          dailyRate: data.unitPrice || data.totalAmount,
          totalAmount: data.totalAmount,
          paidAmount: data.paidAmount,
          balanceAmount: calculatedBalance,
          paymentMethod: data.paymentMethod,
          paymentStatus: calculatedStatus,
          notes: data.notes || null,
        },
      });
    }

    // If supplierName provided and not exists in Supplier table, record it
    if (data.supplierName && data.supplierName.trim()) {
      const existingSupplier = await prisma.supplier.findFirst({
        where: { houseId: data.houseId, name: data.supplierName.trim() },
      });
      if (!existingSupplier) {
        await prisma.supplier.create({
          data: {
            houseId: data.houseId,
            userId: auth.user.userId,
            name: data.supplierName.trim(),
            phone: data.phoneNumber || null,
          },
        });
      }
    }

    await logAuditEvent({
      userId: auth.user.userId,
      userEmail: auth.user.email,
      action: "EXPENSE_CREATED",
      resource: "Expense",
      resourceId: expense.id,
      metadata: {
        amount: expense.totalAmount,
        category: expense.category,
        description: expense.itemDescription,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Expense recorded successfully",
      data: expense,
    });
  } catch (error) {
    console.error("Create expense error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
