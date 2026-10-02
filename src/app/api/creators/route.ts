import { prisma } from "@/lib/db";
import { route, ok, parseIntParam } from "@/lib/api";
import { listCreators } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const GET = route(async (req: Request) => {
  const url = new URL(req.url);
  const result = await listCreators({
    sort: url.searchParams.get("sort") ?? "earnings",
    q: url.searchParams.get("q") ?? undefined,
    page: parseIntParam(url.searchParams.get("page"), 1, 1, 200),
    perPage: parseIntParam(url.searchParams.get("perPage"), 12, 1, 48),
  });

  const followers = result.items.length
    ? await prisma.follow.groupBy({
        by: ["followingId"],
        where: { followingId: { in: result.items.map((i) => i.id) } },
        _count: { _all: true },
      })
    : [];

  const followerMap = new Map(followers.map((f) => [f.followingId, f._count._all]));

  return ok({
    ...result,
    items: result.items.map((i) => ({
      ...i,
      followerCount: followerMap.get(i.id) ?? i._count.followers,
    })),
  });
});