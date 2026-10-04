import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import prisma from "@/lib/db/prisma";
import { logAuditEvent } from "@/lib/services/audit";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await params;

  try {
    const body = await req.json();
    const isActive = Boolean(body.isActive);

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    if (user.role === "ADMIN" && !isActive) {
      return NextResponse.json(
        { success: false, message: "Cannot disable an administrator account" },
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: { id: true, name: true, email: true, isActive: true },
    });

    await logAuditEvent({
      userId: auth.user.userId,
      userEmail: auth.user.email,
      action: isActive ? "USER_ENABLED" : "USER_DISABLED",
      resource: "User",
      resourceId: user.id,
      metadata: { targetUser: user.email, newStatus: isActive },
    });

    return NextResponse.json({
      success: true,
      message: `User ${isActive ? "enabled" : "disabled"} successfully`,
      data: updated,
    });
  } catch (error) {
    console.error("User status update error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
