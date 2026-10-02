import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { route, ok } from "@/lib/api";
import { getCreatorByHandle, getCreatorProjects, getCreatorReviews, toCardData } from "@/lib/queries";
import { ApiError } from "@/lib/api-error";

export const dynamic = "force-dynamic";

export const GET = route(
  async (_req: NextRequest, ctx: { params: Promise<{ handle: string }> }) => {
    const { handle } = await ctx.params;

    const creator = await getCreatorByHandle(handle);
    if (!creator) throw ApiError.notFound("That creator does not exist.");

    const [projects, reviews] = await Promise.all([
      getCreatorProjects(handle, "trending"),
      getCreatorReviews(handle, 5),
    ]);

    const reviewAgg = await prisma.review.aggregate({
      where: { project: { creatorId: creator.id } },
      _avg: { rating: true },
      _count: { _all: true },
    });

    return ok({
      creator: {
        ...creator,
        ratingAvg: reviewAgg._avg.rating ?? creator.ratingAvg,
        ratingCount: reviewAgg._count._all,
      },
      projects: projects.map(toCardData),
      reviews,
    });
  },
  { limit: 120, windowMs: 60_000, scope: "creator" },
);