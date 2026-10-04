import { NextRequest, NextResponse } from "next/server";
import { requireAuth, verifyHouseOwnership } from "@/lib/auth/session";
import prisma from "@/lib/db/prisma";
import { logAuditEvent } from "@/lib/services/audit";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const house = await verifyHouseOwnership(id, auth.user.userId);

  if (!house) {
    return NextResponse.json({ success: false, message: "House not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: house });
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const house = await verifyHouseOwnership(id, auth.user.userId);

  if (!house) {
    return NextResponse.json({ success: false, message: "House not found" }, { status: 404 });
  }

  try {
    const body = await req.json();

    const updated = await prisma.house.update({
      where: { id },
      data: {
        name: body.name ?? house.name,
        ownerName: body.ownerName ?? house.ownerName,
        location: body.location ?? house.location,
        startDate: body.startDate ? new Date(body.startDate) : house.startDate,
        expectedCompletionDate: body.expectedCompletionDate ? new Date(body.expectedCompletionDate) : house.expectedCompletionDate,
        estimatedBudget: body.estimatedBudget !== undefined ? Number(body.estimatedBudget) : house.estimatedBudget,
        numberOfFloors: body.numberOfFloors !== undefined ? Number(body.numberOfFloors) : house.numberOfFloors,
        houseType: body.houseType ?? house.houseType,
        notes: body.notes !== undefined ? body.notes : house.notes,
      },
    });

    await logAuditEvent({
      userId: auth.user.userId,
      userEmail: auth.user.email,
      action: "HOUSE_UPDATED",
      resource: "House",
      resourceId: house.id,
    });

    return NextResponse.json({ success: true, message: "House updated successfully", data: updated });
  } catch (error) {
    console.error("Update house error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const house = await verifyHouseOwnership(id, auth.user.userId);

  if (!house) {
    return NextResponse.json({ success: false, message: "House not found" }, { status: 404 });
  }

  try {
    // Soft delete house
    await prisma.house.update({
      where: { id },
      data: { deletedAt: new Date(), isDefault: false },
    });

    // If this was default, make another house default
    const nextHouse = await prisma.house.findFirst({
      where: { userId: auth.user.userId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
    if (nextHouse) {
      await prisma.house.update({
        where: { id: nextHouse.id },
        data: { isDefault: true },
      });
    }

    await logAuditEvent({
      userId: auth.user.userId,
      userEmail: auth.user.email,
      action: "HOUSE_DELETED",
      resource: "House",
      resourceId: house.id,
    });

    return NextResponse.json({ success: true, message: "House deleted successfully" });
  } catch (error) {
    console.error("Delete house error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
