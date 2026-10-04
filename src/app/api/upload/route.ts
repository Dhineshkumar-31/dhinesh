import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, message: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: "Invalid file type. Only JPG, PNG, WEBP, and PDF files are supported." },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, message: "File exceeds 10MB size limit." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = file.name.split(".").pop() || "bin";
    const uniqueName = `${Date.now()}_${crypto.randomBytes(8).toString("hex")}.${ext}`;

    let fileUrl: string;

    // In serverless environments like Vercel (read-only filesystem), encode as base64 Data URL
    if (process.env.VERCEL || process.env.STORAGE_PROVIDER === "base64") {
      fileUrl = `data:${file.type};base64,${buffer.toString("base64")}`;
    } else {
      try {
        const uploadsDir = path.join(process.cwd(), "public", "uploads");
        await mkdir(uploadsDir, { recursive: true });

        const filePath = path.join(uploadsDir, uniqueName);
        await writeFile(filePath, buffer);

        fileUrl = `/uploads/${uniqueName}`;
      } catch (fsErr) {
        console.warn("Local storage write failed, falling back to data URL:", fsErr);
        fileUrl = `data:${file.type};base64,${buffer.toString("base64")}`;
      }
    }

    return NextResponse.json({
      success: true,
      message: "File uploaded successfully",
      url: fileUrl,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
