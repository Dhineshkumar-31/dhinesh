import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import prisma from "@/lib/db/prisma";

export async function GET() {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  try {
    const stages = await prisma.constructionStage.findMany({
      where: {
        OR: [{ isDefault: true }, { userId: auth.user.userId }],
      },
      orderBy: { orderIndex: "asc" },
    });

    return NextResponse.json({ success: true, data: stages });
  } catch (error) {
    console.error("Stages error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json();
    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ success: false, message: "Stage name is required" }, { status: 400 });
    }

    const count = await prisma.constructionStage.count();

    const stage = await prisma.constructionStage.create({
      data: {
        name: body.name.trim(),
        nameTa: body.nameTa?.trim() || null,
        orderIndex: body.orderIndex || count + 1,
        isDefault: false,
        userId: auth.user.userId,
      },
    });

    return NextResponse.json({ success: true, data: stage, message: "Construction stage created" });
  } catch (error) {
    console.error("Create stage error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
