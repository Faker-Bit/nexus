import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { route, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";

export const dynamic = "force-dynamic";

/** Order detail - the source of truth for the checkout screen. */
export const GET = route(
  async (_req: NextRequest, ctx: { params: Promise<{ orderId: string }> }) => {
    const { orderId } = await ctx.params;
    const user = await requireUser();

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        project: {
          select: {
            id: true,
            slug: true,
            title: true,
            tagline: true,
            coverImage: true,
            fileName: true,
            fileSizeBytes: true,
            downloadCount: true,
            repoUrl: true,
            docsUrl: true,
            demoUrl: true,
          },
        },
        seller: { select: { handle: true, displayName: true, avatarUrl: true, verified: true } },
        review: { select: { id: true, rating: true } },
      },
    });

    if (!order) throw ApiError.notFound("That order does not exist.");
    if (order.buyerId !== user.id && order.sellerId !== user.id) {
      throw ApiError.forbidden("That order is not yours.");
    }

    const h = order.ipHash;
    return ok({
      order: {
        ...order,
        accessToken: order.buyerId === user.id ? order.accessToken : null,
        hasReview: Boolean(order.review),
        ipHash: h ?? null,
      },
    });
  },
  { limit: 120, windowMs: 60_000, scope: "order-read" },
);