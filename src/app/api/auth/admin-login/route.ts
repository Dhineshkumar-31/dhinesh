import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { comparePassword } from "@/lib/auth/password";
import { signToken, AUTH_COOKIE_NAME } from "@/lib/auth/jwt";
import { logAuditEvent } from "@/lib/services/audit";
import { z } from "zod";

const adminLoginSchema = z.object({
  usernameOrEmail: z.string().min(1, "Please enter admin username or email"),
  password: z.string().min(1, "Please enter password"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = adminLoginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ success: false, message: "Invalid parameters" }, { status: 400 });
    }

    const { usernameOrEmail, password } = result.data;
    const lower = usernameOrEmail.toLowerCase();

    const adminUser = await prisma.user.findFirst({
      where: {
        OR: [{ username: lower }, { email: lower }],
        role: "ADMIN",
      },
    });

    if (!adminUser) {
      return NextResponse.json(
        { success: false, message: "Access denied. Valid admin credentials required." },
        { status: 401 }
      );
    }

    if (!adminUser.isActive) {
      return NextResponse.json(
        { success: false, message: "Admin account is deactivated." },
        { status: 403 }
      );
    }

    const isMatch = await comparePassword(password, adminUser.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: "Invalid admin credentials" },
        { status: 401 }
      );
    }

    await prisma.user.update({
      where: { id: adminUser.id },
      data: { lastLogin: new Date() },
    });

    const token = await signToken({
      userId: adminUser.id,
      username: adminUser.username,
      email: adminUser.email,
      role: "ADMIN",
      name: adminUser.name,
    });

    await logAuditEvent({
      userId: adminUser.id,
      userEmail: adminUser.email,
      action: "ADMIN_LOGIN",
      resource: "AdminPortal",
      resourceId: adminUser.id,
    });

    const response = NextResponse.json({
      success: true,
      message: "Admin authentication successful",
      user: {
        id: adminUser.id,
        name: adminUser.name,
        username: adminUser.username,
        email: adminUser.email,
        role: adminUser.role,
      },
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 24 * 60 * 60, // 1 day for admin
    });

    return response;
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
