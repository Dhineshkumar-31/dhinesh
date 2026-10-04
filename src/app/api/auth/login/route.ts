import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { comparePassword } from "@/lib/auth/password";
import { signToken, AUTH_COOKIE_NAME } from "@/lib/auth/jwt";
import { logAuditEvent } from "@/lib/services/audit";
import { z } from "zod";

const loginSchema = z.object({
  identifier: z.string().min(1, "Please enter your username or email"),
  password: z.string().min(1, "Please enter your password"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ success: false, message: "Please fill in all fields" }, { status: 400 });
    }

    const { identifier, password } = result.data;
    const lowerIdentifier = identifier.toLowerCase();

    // Look up user by username or email
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username: lowerIdentifier }, { email: lowerIdentifier }],
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid username/email or password" },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { success: false, message: "Your account has been deactivated. Please contact support." },
        { status: 403 }
      );
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: "Invalid username/email or password" },
        { status: 401 }
      );
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const token = await signToken({
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      action: "USER_LOGIN",
      resource: "User",
      resourceId: user.id,
    });

    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        preferredLanguage: user.preferredLanguage,
      },
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error: unknown) {
    console.error("Login error:", error);
    const err = error as { message?: string; code?: string };
    const msg = err?.message || "";
    if (msg.includes("does not exist") || err?.code === "P2021" || err?.code === "P1001") {
      return NextResponse.json(
        {
          success: false,
          message: "Database tables are not initialized yet. Please run prisma db push or check your database connection.",
        },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
