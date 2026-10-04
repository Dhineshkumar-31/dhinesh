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
    const suppliers = await prisma.supplier.findMany({
      where: { houseId, userId: auth.user.userId },
      orderBy: { name: "asc" },
    });

    // Calculate supplier-wise purchase total from expenses
    const expenses = await prisma.expense.findMany({
      where: { houseId, userId: auth.user.userId, deletedAt: null },
      select: { supplierName: true, totalAmount: true },
    });

    const supplierSpendMap: Record<string, number> = {};
    expenses.forEach((e) => {
      if (e.supplierName) {
        supplierSpendMap[e.supplierName.toLowerCase()] =
          (supplierSpendMap[e.supplierName.toLowerCase()] || 0) + e.totalAmount;
      }
    });

    const enrichedSuppliers = suppliers.map((s) => ({
      ...s,
      totalPurchase: supplierSpendMap[s.name.toLowerCase()] || 0,
    }));

    return NextResponse.json({ success: true, data: enrichedSuppliers });
  } catch (error) {
    console.error("Suppliers error:", error);
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

    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ success: false, message: "Supplier name is required" }, { status: 400 });
    }

    const supplier = await prisma.supplier.create({
      data: {
        houseId: body.houseId,
        userId: auth.user.userId,
        name: body.name.trim(),
        contactPerson: body.contactPerson?.trim() || null,
        phone: body.phone?.trim() || null,
        email: body.email?.trim() || null,
        address: body.address?.trim() || null,
        gstNumber: body.gstNumber?.trim() || null,
        notes: body.notes || null,
      },
    });

    return NextResponse.json({ success: true, message: "Supplier added", data: supplier });
  } catch (error) {
    console.error("Create supplier error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
