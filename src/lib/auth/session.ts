import { getCurrentUser, TokenPayload } from "./jwt";
import prisma from "@/lib/db/prisma";
import { NextResponse } from "next/server";

export interface AuthenticatedContext {
  user: TokenPayload;
}

/**
 * Ensures user is logged in. Returns user token or returns 401 response.
 */
export async function requireAuth(): Promise<{ user: TokenPayload } | { error: NextResponse }> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      error: NextResponse.json(
        { success: false, message: "Unauthorized. Please log in." },
        { status: 401 }
      ),
    };
  }

  // Also verify user is active in database
  const dbUser = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { isActive: true },
  });

  if (!dbUser || !dbUser.isActive) {
    return {
      error: NextResponse.json(
        { success: false, message: "Account is disabled. Contact administrator." },
        { status: 403 }
      ),
    };
  }

  return { user };
}

/**
 * Ensures user has ADMIN role. Returns user token or returns 403 response.
 */
export async function requireAdmin(): Promise<{ user: TokenPayload } | { error: NextResponse }> {
  const auth = await requireAuth();
  if ("error" in auth) return auth;

  if (auth.user.role !== "ADMIN") {
    return {
      error: NextResponse.json(
        { success: false, message: "Forbidden. Admin access required." },
        { status: 403 }
      ),
    };
  }

  return auth;
}

/**
 * Verifies that the given houseId belongs to the authenticated user.
 */
export async function verifyHouseOwnership(houseId: string, userId: string) {
  const house = await prisma.house.findFirst({
    where: {
      id: houseId,
      userId: userId,
      deletedAt: null,
    },
  });
  return house;
}
