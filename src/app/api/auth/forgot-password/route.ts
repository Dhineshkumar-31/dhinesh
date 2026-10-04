import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ success: false, message: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Return success anyway to prevent user enumeration
      return NextResponse.json({
        success: true,
        message: "If that email is registered, password reset instructions have been generated.",
      });
    }

    // Generate secure reset token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        email: user.email,
        token,
        expiresAt,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Reset token generated successfully. In production, this is emailed to the user.",
      resetToken: process.env.NODE_ENV === "development" ? token : undefined,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
