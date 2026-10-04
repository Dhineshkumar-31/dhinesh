import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { logAuditEvent } from "@/lib/services/audit";

export async function POST(req: NextRequest) {
  try {
    const { token, newPassword } = await req.json();

    if (!token || !newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { success: false, message: "Valid token and a minimum 8-character password are required" },
        { status: 400 }
      );
    }

    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetRecord || resetRecord.used || resetRecord.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, message: "Reset token is invalid or has expired." },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(newPassword);

    const user = await prisma.user.update({
      where: { email: resetRecord.email },
      data: { passwordHash },
    });

    await prisma.passwordResetToken.update({
      where: { id: resetRecord.id },
      data: { used: true },
    });

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      action: "PASSWORD_RESET",
      resource: "User",
      resourceId: user.id,
    });

    return NextResponse.json({
      success: true,
      message: "Password has been successfully reset. You can now login with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
