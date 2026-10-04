import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import prisma from "@/lib/db/prisma";
import { logAuditEvent } from "@/lib/services/audit";
import { z } from "zod";

const houseSchema = z.object({
  name: z.string().min(2, "House name is required"),
  ownerName: z.string().min(2, "Owner name is required"),
  location: z.string().min(2, "Location is required"),
  startDate: z.string().min(1, "Start date is required"),
  expectedCompletionDate: z.string().optional().nullable(),
  estimatedBudget: z.number().positive("Estimated budget must be greater than zero"),
  numberOfFloors: z.number().int().min(1).default(1),
  houseType: z.string().default("Independent House"),
  notes: z.string().optional().nullable(),
});

export async function GET() {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  try {
    const houses = await prisma.house.findMany({
      where: {
        userId: auth.user.userId,
        deletedAt: null,
      },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ success: true, data: houses });
  } catch (error) {
    console.error("Fetch houses error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json();
    const result = houseSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: "Validation error", errors: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = result.data;

    // Check if this is the user's first house
    const existingCount = await prisma.house.count({
      where: { userId: auth.user.userId, deletedAt: null },
    });

    const isFirstHouse = existingCount === 0;

    const house = await prisma.house.create({
      data: {
        userId: auth.user.userId,
        name: data.name,
        ownerName: data.ownerName,
        location: data.location,
        startDate: new Date(data.startDate),
        expectedCompletionDate: data.expectedCompletionDate ? new Date(data.expectedCompletionDate) : null,
        estimatedBudget: data.estimatedBudget,
        numberOfFloors: data.numberOfFloors,
        houseType: data.houseType,
        notes: data.notes || null,
        isDefault: isFirstHouse,
      },
    });

    await logAuditEvent({
      userId: auth.user.userId,
      userEmail: auth.user.email,
      action: "HOUSE_CREATED",
      resource: "House",
      resourceId: house.id,
      metadata: { name: house.name, budget: house.estimatedBudget },
    });

    return NextResponse.json({
      success: true,
      message: "House project created successfully",
      data: house,
    });
  } catch (error) {
    console.error("Create house error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
