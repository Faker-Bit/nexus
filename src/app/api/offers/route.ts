import { prisma } from "@/lib/db";
import { route, ok, created, parseBody, parseIntParam } from "@/lib/api";
import { offerCreateSchema } from "@/lib/validation";
import { requireUser } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { feeFromCents } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const GET = route(async (req: Request) => {
  const user = await requireUser();
  const url = new URL(req.url);
  const scope = url.searchParams.get("scope") ?? "buyer";
  const status = url.searchParams.get("status") ?? undefined;
  const page = parseIntParam(url.searchParams.get("page"), 1, 1, 200);

const where =
    scope === "seller"
      ? { project: { creatorId: user.id }, status }
      : { buyerId: user.id, status };

  const [items, total] = await Promise.all([
    prisma.offer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * 20,
      take: 20,
      include: {
        project: { select: { title: true, slug: true, coverImage: true, priceCents: true, creatorId: true } },
        buyer: { select: { handle: true, displayName: true, avatarUrl: true, verified: true } },
      },
    }),
    prisma.offer.count({ where }),
  ]);

  return ok({ items, total, page });
});

export const POST = route(
  async (req: Request) => {
    const user = await requireUser();
    const body = await parseBody(req, offerCreateSchema);

    const project = await prisma.project.findUnique({
      where: { id: body.projectId },
      select: { id: true, slug: true, title: true, creatorId: true, acceptsOffers: true, priceCents: true },
    });
    if (!project) throw ApiError.notFound("That project does not exist.");
    if (project.creatorId === user.id) throw ApiError.badRequest("You cannot offer on your own project.");
    if (!project.acceptsOffers) throw ApiError.badRequest("This creator is not accepting offers.");

    const open = await prisma.offer.findFirst({
      where: { projectId: project.id, buyerId: user.id, status: "pending" },
      select: { id: true },
    });
    if (open) throw ApiError.conflict("You already have a pending offer on this project.");

    if (body.amountCents >= project.priceCents) {
      throw ApiError.badRequest("That is above the list price - buy it directly instead.");
    }

    const offer = await prisma.offer.create({
      data: {
        projectId: project.id,
        buyerId: user.id,
        amountCents: body.amountCents,
        currency: body.currency,
        chain: body.chain,
        message: body.message ?? null,
        expiresAt: new Date(Date.now() + body.expiresInDays * 86400000),
      },
    });

    await prisma.notification.create({
      data: {
        userId: project.creatorId,
        type: "offer",
        title: "New offer received",
        body: `${user.displayName} offered on “${project.title}”.`,
        link: "/dashboard/offers",
        meta: JSON.stringify({ offerId: offer.id }),
      },
    });

    return created({
      offer,
      feeCents: feeFromCents(body.amountCents),
      payoutCents: body.amountCents - feeFromCents(body.amountCents),
    });
  },
  { limit: 15, windowMs: 60_000, scope: "offer-create" },
);