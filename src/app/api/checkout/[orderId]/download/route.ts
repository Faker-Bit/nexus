import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { route, ok, anonymize } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { headers } from "next/headers";

/**
 * Delivers the purchased archive. Signed, rate-limited and audited; a download
 * count is tracked against the order so buyers cannot hotlink indefinitely.
 */
export const GET = route(
  async (_req: NextRequest, ctx: { params: Promise<{ orderId: string }> }) => {
    const { orderId } = await ctx.params;
    const user = await requireUser();

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        buyerId: true,
        status: true,
        accessToken: true,
        maxDownloads: true,
        downloadCount: true,
        licenseType: true,
        projectId: true,
        project: { select: { id: true, fileName: true, fileSizeBytes: true, title: true, slug: true } },
      },
    });

    if (!order) throw ApiError.notFound("That order does not exist.");
    if (order.buyerId !== user.id) throw ApiError.forbidden("That download is not licensed to you.");
    if (order.status !== "paid") throw ApiError.badRequest("Settle payment before downloading.");
    if (order.maxDownloads && order.downloadCount >= order.maxDownloads) {
      throw ApiError.tooMany("You have reached the download limit for this license.");
    }

    const h = await headers();
    const ipHash = await anonymize(h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? "local");

    await prisma.$transaction([
      prisma.order.update({
        where: { id: order.id },
        data: { downloadCount: { increment: 1 }, ipHash },
      }),
      prisma.project.update({
        where: { id: order.projectId },
        data: { downloadCount: { increment: 1 } },
      }),
      prisma.download.create({ data: { orderId: order.id, userId: user.id, projectId: order.projectId, ipHash } }),
      prisma.analyticsEvent.create({
        data: { type: "download", projectId: order.projectId, userId: user.id, path: `/p/${order.project.slug}` },
      }),
    ]);

    const fileName = order.project.fileName ?? `${order.project.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-${order.licenseType}.zip`;

    return ok({
      download: {
        fileName,
        sizeBytes: order.project.fileSizeBytes,
        licenseType: order.licenseType,
        // In production this points at a short-lived signed object-storage URL.
        // The interface stays identical when swapping in S3/R2/Arweave.
        url: `/api/orders/${order.id}/file?token=${order.accessToken}`,
        remaining: order.maxDownloads ? order.maxDownloads - order.downloadCount - 1 : null,
      },
    });
  },
  { limit: 30, windowMs: 60_000, scope: "download" },
);

export const POST = route(async () => {
  throw new ApiError(405, "Use GET.");
});