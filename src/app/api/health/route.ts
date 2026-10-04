import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const dbUrl = process.env.DATABASE_URL || "";
  const maskedUrl = dbUrl
    ? dbUrl.replace(/:([^:@]+)@/, ":****@")
    : "NOT_SET";

  const diagnostics: Record<string, unknown> = {
    status: "checking",
    timestamp: new Date().toISOString(),
    environment: {
      isVercel: Boolean(process.env.VERCEL),
      nodeEnv: process.env.NODE_ENV,
      databaseUrlConfigured: Boolean(dbUrl),
      databaseUrlMasked: maskedUrl,
      authSecretConfigured: Boolean(process.env.AUTH_SECRET),
    },
  };

  try {
    // 1. Test raw connection
    await prisma.$queryRaw`SELECT 1 as connected`;
    diagnostics.dbConnection = "SUCCESS";

    // 2. Check existing tables in public schema
    const tables: Array<{ table_name: string }> = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    const tableNames = tables.map((t) => t.table_name);
    diagnostics.existingTables = tableNames;
    diagnostics.tablesCount = tableNames.length;

    // 3. Check User table
    if (tableNames.some((t) => t.toLowerCase() === "user")) {
      const userCount = await prisma.user.count();
      diagnostics.userCount = userCount;
    } else {
      diagnostics.userTableStatus = "MISSING - Tables have not been pushed to this database yet";
    }

    // 4. Check Categories
    if (tableNames.some((t) => t.toLowerCase() === "expensecategory")) {
      const categoryCount = await prisma.expenseCategory.count();
      diagnostics.categoryCount = categoryCount;
    }

    diagnostics.status = tableNames.length > 0 ? "HEALTHY" : "TABLES_MISSING";
    return NextResponse.json({ success: true, diagnostics });
  } catch (err: unknown) {
    const errorObj = err as { message?: string; code?: string; meta?: unknown };
    diagnostics.status = "ERROR";
    diagnostics.error = {
      message: errorObj.message || String(err),
      code: errorObj.code,
      meta: errorObj.meta,
    };
    return NextResponse.json({ success: false, diagnostics }, { status: 500 });
  }
}
