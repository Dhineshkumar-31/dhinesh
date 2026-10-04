import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import prisma from "@/lib/db/prisma";
import { hashPassword, comparePassword } from "@/lib/auth/password";
import { logAuditEvent } from "@/lib/services/audit";

export async function GET() {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  try {
    const user = await prisma.user.findUnique({
      where: { id: auth.user.userId },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        preferredLanguage: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error("Profile error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json();
    const user = await prisma.user.findUnique({ where: { id: auth.user.userId } });

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};

    if (body.name && body.name.trim()) updateData.name = body.name.trim();
    if (body.preferredLanguage && ["en", "ta"].includes(body.preferredLanguage)) {
      updateData.preferredLanguage = body.preferredLanguage;
    }

    if (body.email && body.email.toLowerCase() !== user.email) {
      const emailConflict = await prisma.user.findUnique({
        where: { email: body.email.toLowerCase() },
      });
      if (emailConflict) {
        return NextResponse.json({ success: false, message: "Email is already in use by another account" }, { status: 409 });
      }
      updateData.email = body.email.toLowerCase();
    }

    // Change password if provided
    if (body.newPassword) {
      if (!body.currentPassword) {
        return NextResponse.json({ success: false, message: "Current password is required to set new password" }, { status: 400 });
      }

      const match = await comparePassword(body.currentPassword, user.passwordHash);
      if (!match) {
        return NextResponse.json({ success: false, message: "Current password does not match" }, { status: 400 });
      }

      if (body.newPassword.length < 8) {
        return NextResponse.json({ success: false, message: "New password must be at least 8 characters" }, { status: 400 });
      }

      updateData.passwordHash = await hashPassword(body.newPassword);
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        preferredLanguage: true,
      },
    });

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      action: "PROFILE_UPDATED",
      resource: "User",
      resourceId: user.id,
    });

    return NextResponse.json({ success: true, message: "Profile updated successfully", data: updated });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
