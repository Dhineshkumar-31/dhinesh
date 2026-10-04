import prisma from "@/lib/db/prisma";

export async function logAuditEvent({
  userId,
  userEmail,
  action,
  resource,
  resourceId,
  ipAddress,
  metadata,
}: {
  userId?: string;
  userEmail?: string;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress?: string;
  metadata?: Record<string, unknown> | string;
}) {
  try {
    const metaString =
      typeof metadata === "object" ? JSON.stringify(metadata) : metadata;

    await prisma.auditLog.create({
      data: {
        userId,
        userEmail,
        action,
        resource,
        resourceId,
        ipAddress,
        metadata: metaString,
      },
    });
  } catch (err) {
    console.error("Audit log failed:", err);
  }
}
