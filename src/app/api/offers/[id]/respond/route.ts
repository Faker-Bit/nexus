import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { route, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { offerRespondSchema } from "@/lib/validation";
import { parseBody } from "@/lib/api";
import { ApiError } from "@/lib/api-error";

/** Creator responds to an offer: accept (creates a live checkout) or decline. */
export const POST = route(
  async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params;
    const user = await requireUser();
    const body = await parseBody(req, offerRespondSchema);

    const offer = await prisma.offer.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        buyerId: true,
        amountCents: true,
        currency: true,
        chain: true,
        projectId: true,
        expiresAt: true,
        project: { select: { creatorId: true, title: true, slug: true, status: true } },
      },
    });

    if (!offer) throw ApiError.notFound("That offer does not exist.");
    if (offer.project.creatorId !== user.id) throw ApiError.forbidden("That offer is not yours to answer.");
    if (offer.status !== "pending") throw ApiError.conflict("This offer has already been answered.");
    if (offer.expiresAt.getTime() < Date.now()) {
      await prisma.offer.update({ where: { id }, data: { status: "expired", respondedAt: new Date() } });
      throw ApiError.badRequest("This offer has expired.");
    }

    if (body.action === "decline") {
      const declined = await prisma.offer.update({
        where: { id },
        data: { status: "declined", respondedAt: new Date() },
      });
      await prisma.notification.create({
        data: {
          userId: offer.buyerId,
          type: "offer",
          title: "Offer declined",
          body: `Your offer on “${offer.project.title}” was declined${body.note ? `: ${body.note}` : "."}`,
          link: `/p/${offer.project.slug}`,
        },
      });
      return ok({ offer: declined });
    }

    const accepted = await prisma.offer.update({
      where: { id },
      data: { status: "accepted", respondedAt: new Date() },
    });

    await prisma.notification.create({
      data: {
        userId: offer.buyerId,
        type: "offer",
        title: "Offer accepted",
        body: `Your offer on “${offer.project.title}” was accepted. Complete payment to unlock the files.`,
        link: `/checkout?offer=${offer.id}`,
        meta: JSON.stringify({ offerId: offer.id }),
      },
    });

    return ok({ offer: accepted, checkout: { projectId: offer.projectId, amountCents: offer.amountCents } });
  },
  { limit: 60, windowMs: 60_000, scope: "offer-respond" },
);