import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, getCurrentUser } from "@/lib/auth/jwt";
import { logAuditEvent } from "@/lib/services/audit";

export async function POST() {
  const user = await getCurrentUser();
  if (user) {
    await logAuditEvent({
      userId: user.userId,
      userEmail: user.email,
      action: "USER_LOGOUT",
      resource: "User",
      resourceId: user.userId,
    });
  }

  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully",
  });

  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });

  return response;
}
