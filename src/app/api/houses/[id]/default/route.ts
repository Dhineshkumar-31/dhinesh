import { NextRequest, NextResponse } from "next/server";
import { requireAuth, verifyHouseOwnership } from "@/lib/auth/session";
import prisma from "@/lib/db/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const house = await verifyHouseOwnership(id, auth.user.userId);

  if (!house) {
    return NextResponse.json({ success: false, message: "House not found" }, { status: 404 });
  }

  try {
    // Unset all other defaults for user
    await prisma.house.updateMany({
      where: { userId: auth.user.userId },
      data: { isDefault: false },
    });

    // Set this house as default
    const updated = await prisma.house.update({
      where: { id },
      data: { isDefault: true },
    });

    return NextResponse.json({ success: true, message: "Active house updated", data: updated });
  } catch (error) {
    console.error("Set default house error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
