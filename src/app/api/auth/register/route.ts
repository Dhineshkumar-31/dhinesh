import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { signToken, AUTH_COOKIE_NAME } from "@/lib/auth/jwt";
import { logAuditEvent } from "@/lib/services/audit";
import { z } from "zod";

const registerSchema = z
  .object({
    name: z.string().min(2, "Full name must be at least 2 characters"),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .regex(/^[a-zA-Z0-9_.-]+$/, "Username can only contain letters, numbers, and _.-"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        if (!errors[field]) errors[field] = issue.message;
      });
      return NextResponse.json({ success: false, errors, message: "Validation failed" }, { status: 400 });
    }

    const { name, username, email, password } = result.data;

    // Check unique email
    const existingEmail = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existingEmail) {
      return NextResponse.json(
        { success: false, errors: { email: "This email is already registered" }, message: "Email already taken" },
        { status: 409 }
      );
    }

    // Check unique username
    const existingUsername = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
    });
    if (existingUsername) {
      return NextResponse.json(
        { success: false, errors: { username: "This username is already taken" }, message: "Username already taken" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        name,
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        passwordHash,
        role: "USER",
        preferredLanguage: "en",
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        preferredLanguage: true,
      },
    });

    const token = await signToken({
      userId: newUser.id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      name: newUser.name,
    });

    await logAuditEvent({
      userId: newUser.id,
      userEmail: newUser.email,
      action: "USER_REGISTER",
      resource: "User",
      resourceId: newUser.id,
    });

    const response = NextResponse.json({
      success: true,
      message: "Registration successful",
      user: newUser,
    });

    // Set secure HTTP-only cookie
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
