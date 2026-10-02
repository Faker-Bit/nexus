import type { NextRequest } from "next/server";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { route, ok, parseBody, anonymize } from "@/lib/api";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { payments } from "@/lib/payments/provider";
import { bustCache } from "@/lib/db";
import { recordEvent } from "@/lib/analytics";
import { headers } from "next/headers";

const confirmSchema = z.object({
  txHash: z.string().trim().max(120).optional(),
  signature: z.string().trim().max(400).optional(),
});

/** Marks an order paid after the provider confirms settlement. */
export const POST = route(
  async (req: NextRequest, ctx: { params: Promise<{ orderId: string }> }) => {
    const { orderId: id } = await ctx.params;
    const user = await requireUser();
    await parseBody(req, confirmSchema);

    const order = await prisma.order.findUnique({
      where: { id },
      include: { project: { select: { id: true, slug: true, title: true } } },
    });
    if (!order) throw ApiError.notFound("That order does not exist.");
    if (order.buyerId !== user.id) throw ApiError.forbidden("That order is not yours.");
    if (order.status === "paid") return ok({ order, alreadyPaid: true });
    if (order.status === "refunded") throw ApiError.conflict("This order was refunded.");
    if (order.paymentIntentId == null) throw ApiError.badRequest("No payment intent exists for this order.");

    const provider = payments();
    const intent = await provider.createIntent({
      orderId: order.id,
      orderReference: order.reference,
      amountCents: order.amountCents,
      currency: order.currency,
      chain: order.chain,
      memecoin: order.memecoin,
      fromAddress: "0x0",
      payTo: "0x0",
    });
    const confirmed = await provider.confirm(intent);

    const updated = await prisma.$transaction(async (tx) => {
      const paid = await tx.order.update({
        where: { id: order.id },
        data: {
          status: "paid",
          paidAt: new Date(),
          txHash: confirmed.txHash,
          blockNumber: confirmed.blockNumber,
          licenseKey: `NX-${randomBytes(4).toString("hex").toUpperCase()}-${randomBytes(2).toString("hex").toUpperCase()}`,
          failureReason: null,
        },
      });

      await tx.transaction.updateMany({
        where: { orderId: order.id, status: "pending" },
        data: {
          status: "confirmed",
          txHash: confirmed.txHash,
          blockNumber: confirmed.blockNumber,
          confirmedAt: new Date(),
        },
      });

      await tx.project.update({
        where: { id: order.projectId },
        data: { saleCount: { increment: 1 }, trendingScore: { increment: 6 } },
      });

      await tx.user.update({
        where: { id: order.sellerId },
        data: {
          totalSales: { increment: 1 },
          totalEarningsCents: { increment: order.sellerPayoutCents },
          reputation: { increment: 1 },
        },
      });

      await tx.notification.create({
        data: {
          userId: order.sellerId,
          type: "sale",
          title: "New sale",
          body: `${user.displayName} bought “${order.project.title}” for ${order.amountCents / 100} ${order.currency}.`,
          link: "/dashboard/sales",
          meta: JSON.stringify({ orderId: order.id }),
        },
      });

      if (order.offerId) {
        await tx.offer.update({ where: { id: order.offerId }, data: { orderId: order.id, status: "converted" } });
      }

      return paid;
    });

    const h = await headers();
    await anonymize(h.get("x-forwarded-for") ?? "local");

    await recordEvent({ type: "checkout_start", projectId: order.projectId, userId: user.id });
    bustCache("landing");

    return ok({
      order: {
        id: updated.id,
        reference: updated.reference,
        status: updated.status,
        txHash: updated.txHash,
        licenseKey: updated.licenseKey,
        amountCents: updated.amountCents,
        currency: updated.currency,
      },
      confirmations: confirmed.confirmations,
      explorerUrl: confirmed.explorerUrl,
    });
  },
  { limit: 10, windowMs: 60_000, scope: "checkout-confirm" },
);