import { prisma } from "@/lib/db";
import { route, ok, parseIntParam } from "@/lib/api";
import { requireCreator } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const GET = route(
  async (req: Request) => {
    const user = await requireCreator();
    const url = new URL(req.url);
    const page = parseIntParam(url.searchParams.get("page"), 1, 1, 500);
    const perPage = parseIntParam(url.searchParams.get("perPage"), 20, 1, 60);
    const status = url.searchParams.get("status") ?? undefined;
    const q = url.searchParams.get("q")?.trim();

    const where: Record<string, unknown> = { creatorId: user.id };
    if (status && status !== "all") where.status = status;
    if (q) where.OR = [{ title: { contains: q } }, { tagsString: { contains: q.toLowerCase() } }];

    const [items, total, counts] = await Promise.all([
      prisma.project.findMany({
        where: where as never,
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
        select: {
          id: true,
          slug: true,
          title: true,
          tagline: true,
          category: true,
          tagsString: true,
          status: true,
          priceCents: true,
          currency: true,
          chain: true,
          coverImage: true,
          fileName: true,
          fileSizeBytes: true,
          demoUrl: true,
          repoUrl: true,
          docsUrl: true,
          websiteUrl: true,
          previewVideo: true,
          acceptsOffers: true,
          acceptsMeme: true,
          memeToken: true,
          language: true,
          license: true,
          featured: true,
          saleCount: true,
          viewCount: true,
          likeCount: true,
          ratingAvg: true,
          ratingCount: true,
          trendingScore: true,
          publishedAt: true,
          updatedAt: true,
          createdAt: true,
          assets: { orderBy: { position: "asc" }, select: { id: true, url: true, kind: true, alt: true } },
          tags: { select: { name: true } },
          _count: { select: { orders: true, reviews: true, offers: true } },
        },
      }),
      prisma.project.count({ where: where as never }),
      prisma.project.groupBy({ by: ["status"], where: { creatorId: user.id }, _count: { _all: true } }),
    ]);

    return ok({
      items,
      total,
      page,
      pages: Math.max(1, Math.ceil(total / perPage)),
      counts: Object.fromEntries(counts.map((c) => [c.status, c._count._all])),
    });
  },
  { limit: 120, windowMs: 30_000, scope: "my-projects" },
);