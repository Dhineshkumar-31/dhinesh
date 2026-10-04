import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import prisma from "@/lib/db/prisma";

export async function GET() {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  try {
    const categories = await prisma.expenseCategory.findMany({
      where: {
        OR: [{ isDefault: true }, { userId: auth.user.userId }],
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    console.error("Categories error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json();
    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ success: false, message: "Category name is required" }, { status: 400 });
    }

    const category = await prisma.expenseCategory.create({
      data: {
        name: body.name.trim(),
        nameTa: body.nameTa?.trim() || null,
        type: body.type || "MATERIAL",
        icon: body.icon || "Tag",
        isDefault: false,
        userId: auth.user.userId,
      },
    });

    return NextResponse.json({ success: true, data: category, message: "Category created" });
  } catch (error) {
    console.error("Create category error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
