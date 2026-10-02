import { randomUUID, randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { route, ok, created, parseBody } from "@/lib/api";
import { checkoutSchema } from "@/lib/validation";
import { requireUser } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { checkoutMath } from "@/lib/queries";
import { feeFromCents, LICENSE_TIERS, MEMECOINS, tokenMeta } from "@/lib/constants";
import { payments } from "@/lib/payments/provider";
import { bustCache } from "@/lib/db";

/**
 * Creates an order in `awaiting_payment` and a payment intent.
 * Settlement happens in `confirm` - access tokens are only minted after the
 * provider reports a confirmed transfer, so nothing is delivered unpaid.
 */
export const POST = route(
  async (req: Request) => {
    const user = await requireUser();
    const body = await parseBody(req, checkoutSchema);

    const project = await prisma.project.findUnique({
      where: { id: body.projectId },
      select: {
        id: true,
        slug: true,
        title: true,
        creatorId: true,
        priceCents: true,
        currency: true,
        chain: true,
        status: true,
        acceptsMeme: true,
        creator: { select: { payoutAddress: true, defaultChain: true } },
      },
    });
    if (!project) throw ApiError.notFound("That project does not exist.");
    if (project.creatorId === user.id) throw ApiError.badRequest("You cannot buy your own project.");
    if (project.status !== "published") throw ApiError.badRequest("This listing is not available.");

    const existing = await prisma.order.findFirst({
      where: { projectId: project.id, buyerId: user.id, status: { in: ["pending", "awaiting_payment"] } },
      select: { id: true, reference: true },
    });
    if (existing) throw ApiError.conflict(`You already have an open checkout (${existing.reference}).`);

    const paid = await prisma.order.findFirst({
      where: { projectId: project.id, buyerId: user.id, status: "paid" },
      select: { id: true },
    });
    if (paid) throw ApiError.conflict("You already own this project. Find it in your library.");

    // Offers lock the price; otherwise the license tier multiplies the list price.
    let baseCents = project.priceCents;
    let offerId: string | null = null;
    if (body.offerId) {
      const offer = await prisma.offer.findUnique({ where: { id: body.offerId } });
      if (!offer) throw ApiError.notFound("That offer does not exist.");
      if (offer.buyerId !== user.id) throw ApiError.forbidden("That offer belongs to someone else.");
      if (offer.projectId !== project.id) throw ApiError.badRequest("That offer is for a different project.");
      if (offer.status !== "accepted") throw ApiError.badRequest("That offer has not been accepted yet.");
      if (offer.expiresAt.getTime() < Date.now()) throw ApiError.badRequest("That offer has expired.");
      baseCents = offer.amountCents;
      offerId = offer.id;
    }

    const tier = LICENSE_TIERS.find((t) => t.key === body.licenseType) ?? LICENSE_TIERS[0];
    const math = checkoutMath(baseCents, offerId ? 1 : tier.multiplier);
    const feeCents = feeFromCents(math.grossCents);

    const memecoin =
      body.memecoin && project.acceptsMeme && MEMECOINS.some((m) => m.symbol === body.memecoin)
        ? body.memecoin
        : null;

    const currency = memecoin ?? body.currency;
    if (!tokenMeta(currency)) throw ApiError.badRequest("Unsupported settlement token.");

    const reference = `NX-${randomBytes(4).toString("hex").toUpperCase()}`;

    const order = await prisma.order.create({
      data: {
        reference,
        projectId: project.id,
        buyerId: user.id,
        sellerId: project.creatorId,
        offerId,
        listPriceCents: project.priceCents,
        amountCents: math.grossCents,
        platformFeeCents: feeCents,
        sellerPayoutCents: math.grossCents - feeCents,
        currency,
        chain: body.chain ?? project.chain,
        memecoin: Boolean(memecoin),
        status: "awaiting_payment",
        licenseType: tier.key,
        accessToken: randomUUID().replace(/-/g, "") + randomBytes(8).toString("hex"),
      },
      select: {
        id: true,
        reference: true,
        status: true,
        amountCents: true,
        currency: true,
        chain: true,
        licenseType: true,
        createdAt: true,
      },
    });

    const intent = await payments().createIntent({
      orderId: order.id,
      orderReference: reference,
      amountCents: math.grossCents,
      currency,
      chain: order.chain,
      memecoin: Boolean(memecoin),
      fromAddress: user.payoutAddress ?? "0x0000000000000000000000000000000000000000",
      payTo: project.creator.payoutAddress ?? "0x0000000000000000000000000000000000000000",
    });

    await prisma.order.update({ where: { id: order.id }, data: { paymentIntentId: intent.id } });
    await prisma.transaction.create({
      data: {
        orderId: order.id,
        userId: user.id,
        type: "purchase",
        direction: "out",
        amountCents: math.grossCents,
        currency,
        chain: order.chain,
        status: "pending",
      },
    });

    bustCache("landing");
    return created({ order, intent, provider: payments().name });
  },
  { limit: 12, windowMs: 60_000, scope: "checkout" },
);

export const GET = route(async () => ok({ supported: ["USDC", "USDT", "DAI", "ETH", "PEPE", "WIF", "BONK", "SHIB"] }));