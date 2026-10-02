import { prisma } from "@/lib/db";
import { route, created, parseBody } from "@/lib/api";
import { reviewCreateSchema } from "@/lib/validation";
import { requireUser } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { bustCache } from "@/lib/db";

/** Reviews only exist for delivered orders - one per order, forever. */
export const POST = route(
  async (req: Request) => {
    const user = await requireUser();
    const body = await parseBody(req, reviewCreateSchema);

    const order = await prisma.order.findUnique({
      where: { id: body.orderId },
      select: {
        id: true,
        buyerId: true,
        projectId: true,
        status: true,
        review: { select: { id: true } },
        project: { select: { title: true, slug: true, creatorId: true } },
      },
    });

    if (!order) throw ApiError.notFound("That order does not exist.");
    if (order.buyerId !== user.id) throw ApiError.forbidden("You can only review your own purchases.");
    if (order.status !== "paid") throw ApiError.badRequest("You can review once the payment settles.");
    if (order.review) throw ApiError.conflict("You already reviewed this purchase.");
    if (order.project.creatorId === user.id) throw ApiError.forbidden("You cannot review your own project.");

    const review = await prisma.review.create({
      data: {
        projectId: order.projectId,
        orderId: order.id,
        authorId: user.id,
        rating: body.rating,
        title: body.title ?? null,
        body: body.body,
      },
      include: { author: { select: { id: true, handle: true, displayName: true, avatarUrl: true, verified: true } } },
    });

    const [avg, count] = await Promise.all([
      prisma.review.aggregate({ where: { projectId: order.projectId }, _avg: { rating: true }, _count: { _all: true } }),
      prisma.review.count({ where: { authorId: user.id } }),
    ]);

    await prisma.$transaction([
      prisma.project.update({
        where: { id: order.projectId },
        data: { ratingAvg: Math.round((avg._avg.rating ?? 0) * 10) / 10, ratingCount: avg._count._all },
      }),
      prisma.user.update({
        where: { id: order.project.creatorId },
        data: {
          ratingCount: { increment: 1 },
          reputation: { increment: Math.round(body.rating >= 5 ? 2 : body.rating >= 4 ? 1 : 0) },
        },
      }),
      prisma.notification.create({
        data: {
          userId: order.project.creatorId,
          type: "review",
          title: `New ${body.rating}★ review`,
          body: `${user.displayName} reviewed “${order.project.title}”.`,
          link: `/p/${order.project.slug}`,
        },
      }),
    ]);

    bustCache("landing");
    return created({ review, reviewCount: count });
  },
  { limit: 10, windowMs: 60_000, scope: "review-create" },
);