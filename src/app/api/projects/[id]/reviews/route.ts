import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { route, ok, parseIntParam } from "@/lib/api";
import { getProjectRatings, getProjectReviews } from "@/lib/queries";
import { ApiError } from "@/lib/api-error";

export const dynamic = "force-dynamic";

export const GET = route(
  async (_req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params;
    const url = new URL(_req.url);
    const take = parseIntParam(url.searchParams.get("take"), 6, 1, 40);

    const exists = await prisma.project.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw ApiError.notFound("That project does not exist.");

    const [reviews, buckets] = await Promise.all([
      getProjectReviews(id, take),
      getProjectRatings(id),
    ]);

    return ok({ reviews, buckets });
  },
  { limit: 120, windowMs: 60_000, scope: "reviews" },
);