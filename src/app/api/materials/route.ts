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
    const materials = await prisma.material.findMany({
      where: { houseId, userId: auth.user.userId },
      orderBy: { purchaseDate: "desc" },
    });

    const totalCost = materials.reduce((acc, curr) => acc + curr.totalCost, 0);

    return NextResponse.json({
      success: true,
      data: materials,
      totalCost,
    });
  } catch (error) {
    console.error("Materials error:", error);
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

    const material = await prisma.material.create({
      data: {
        houseId: body.houseId,
        userId: auth.user.userId,
        name: body.name,
        category: body.category || "General Material",
        quantity: Number(body.quantity || 1),
        unit: body.unit || "Unit",
        unitPrice: Number(body.unitPrice || 0),
        totalCost: Number(body.totalCost || Number(body.quantity || 1) * Number(body.unitPrice || 0)),
        supplier: body.supplier || null,
        purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : new Date(),
        invoiceNumber: body.invoiceNumber || null,
        notes: body.notes || null,
      },
    });

    return NextResponse.json({ success: true, message: "Material saved", data: material });
  } catch (error) {
    console.error("Create material error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
