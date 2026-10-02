import type { Prisma } from "@prisma/client";
import { prisma, cached } from "./db";
import type { DiscoveryInput } from "./validation";
import { CATEGORY_MAP, CHAIN_KEYS, MEME_SYMBOLS, SORTS, TOKENS, LICENSE_MAP, feeFromCents } from "./constants";
import { parseTags } from "./utils";

export const creatorCardSelect = {
  id: true,
  handle: true,
  displayName: true,
  avatarUrl: true,
  verified: true,
  bio: true,
} satisfies Prisma.UserSelect;

export const projectCardSelect = {
  id: true,
  slug: true,
  title: true,
  tagline: true,
  summary: true,
  category: true,
  tagsString: true,
  language: true,
  license: true,
  priceCents: true,
  originalPriceCents: true,
  currency: true,
  chain: true,
  acceptsOffers: true,
  acceptsMeme: true,
  memeToken: true,
  coverImage: true,
  saleCount: true,
  likeCount: true,
  viewCount: true,
  ratingAvg: true,
  ratingCount: true,
  trendingScore: true,
  featured: true,
  publishedAt: true,
  updatedAt: true,
  createdAt: true,
  creator: { select: creatorCardSelect },
  _count: { select: { assets: true, reviews: true } },
} satisfies Prisma.ProjectSelect;

export type ProjectCard = Prisma.ProjectGetPayload<{ select: typeof projectCardSelect }>;

const orderByFor: Record<string, Prisma.ProjectOrderByWithRelationInput[]> = {
  trending: [{ trendingScore: "desc" }, { saleCount: "desc" }],
  newest: [{ publishedAt: "desc" }],
  "price-asc": [{ priceCents: "asc" }],
  "price-desc": [{ priceCents: "desc" }],
  rating: [{ ratingAvg: "desc" }, { ratingCount: "desc" }],
  "best-selling": [{ saleCount: "desc" }, { ratingAvg: "desc" }],
  updated: [{ updatedAt: "desc" }],
};

function buildWhere(input: Partial<DiscoveryInput>): Prisma.ProjectWhereInput {
  const where: Prisma.ProjectWhereInput = { status: "published" };

  if (input.q) {
    const q = input.q;
    where.OR = [
      { title: { contains: q } },
      { tagline: { contains: q } },
      { summary: { contains: q } },
      { tagsString: { contains: q.toLowerCase() } },
      { language: { contains: q } },
      { category: { contains: q.toLowerCase() } },
      { creator: { handle: { contains: q.toLowerCase() } } },
      { creator: { displayName: { contains: q } } },
    ];
  }
  if (input.category && input.category !== "all") where.category = input.category;
  if (input.language) where.language = input.language;
  if (input.license) where.license = input.license;
  if (input.featured) where.featured = true;
  if (input.free) where.priceCents = 0;
  if (typeof input.minPrice === "number" || typeof input.maxPrice === "number") {
    where.priceCents = {
      ...(typeof input.minPrice === "number" ? { gte: input.minPrice } : {}),
      ...(typeof input.maxPrice === "number" ? { lte: input.maxPrice } : {}),
    };
  }
  if (typeof input.minRating === "number" && input.minRating > 0) {
    where.ratingAvg = { gte: input.minRating };
  }
  if (input.tags) {
    const tags = input.tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
    if (tags.length) {
      where.AND = tags.map((tag) => ({ tags: { some: { name: tag } } }));
    }
  }
  return where;
}

export async function discoverProjects(input: DiscoveryInput) {
  const where = buildWhere(input);
  const orderBy = orderByFor[input.sort] ?? orderByFor.trending;
  const skip = (input.page - 1) * input.perPage;

  const [items, total, facets] = await Promise.all([
    prisma.project.findMany({
      where,
      orderBy,
      skip,
      take: input.perPage,
      select: projectCardSelect,
    }),
    prisma.project.count({ where }),
    prisma.project.groupBy({ by: ["category"], where: { status: "published" }, _count: { _all: true } }),
  ]);

  return {
    items,
    total,
    page: input.page,
    perPage: input.perPage,
    pages: Math.max(1, Math.ceil(total / input.perPage)),
    categoryCounts: Object.fromEntries(facets.map((f) => [f.category, f._count._all])),
  };
}

export async function getProjectBySlug(slug: string) {
  return prisma.project.findUnique({
    where: { slug },
    include: {
      creator: { select: creatorCardSelect },
      assets: { orderBy: { position: "asc" } },
      tags: true,
      _count: { select: { reviews: true, assets: true, likes: true } },
    },
  });
}

export async function getProjectRatings(projectId: string) {
  const bucket = await prisma.review.groupBy({
    by: ["rating"],
    where: { projectId },
    _count: { _all: true },
  });
  return bucket.map((b) => ({ rating: b.rating, count: b._count._all }));
}

export async function getProjectReviews(projectId: string, take = 6) {
  return prisma.review.findMany({
    where: { projectId },
    orderBy: [{ helpful: "desc" }, { createdAt: "desc" }],
    take,
    include: {
      author: { select: { id: true, handle: true, displayName: true, avatarUrl: true, verified: true } },
    },
  });
}

export async function getRelatedProjects(project: { id: string; category: string; tags: { name: string }[] }, take = 4) {
  const tagNames = project.tags.map((t) => t.name);
  return prisma.project.findMany({
    where: {
      status: "published",
      id: { not: project.id },
      OR: [{ category: project.category }, ...(tagNames.length ? [{ tags: { some: { name: { in: tagNames } } } }] : [])],
    },
    orderBy: { trendingScore: "desc" },
    take,
    select: projectCardSelect,
  });
}

export async function getLandingData() {
  return cached("landing", 60, async () => {
    const [featured, trending, newest, topCreators, stats, categories] = await Promise.all([
      prisma.project.findMany({
        where: { status: "published", featured: true },
        orderBy: { trendingScore: "desc" },
        take: 6,
        select: projectCardSelect,
      }),
      prisma.project.findMany({
        where: { status: "published" },
        orderBy: [{ trendingScore: "desc" }],
        take: 12,
        select: projectCardSelect,
      }),
      prisma.project.findMany({
        where: { status: "published" },
        orderBy: { publishedAt: "desc" },
        take: 12,
        select: projectCardSelect,
      }),
      prisma.user.findMany({
        where: { isCreator: true },
        orderBy: [{ verified: "desc" }, { totalEarningsCents: "desc" }],
        take: 8,
        select: {
          ...creatorCardSelect,
          reputation: true,
          totalSales: true,
          totalEarningsCents: true,
          ratingAvg: true,
          ratingCount: true,
          location: true,
          github: true,
          twitter: true,
          createdAt: true,
          _count: { select: { projects: true, followers: true } },
        },
      }),
      Promise.all([
        prisma.project.count({ where: { status: "published" } }),
        prisma.user.count({ where: { isCreator: true } }),
        prisma.order.aggregate({ where: { status: "paid" }, _sum: { amountCents: true }, _count: { _all: true } }),
        prisma.user.aggregate({ _sum: { totalEarningsCents: true } }),
      ]),
      prisma.project.groupBy({
        by: ["category"],
        where: { status: "published" },
        _count: { _all: true },
        _sum: { saleCount: true },
      }),
    ]);

    return {
      featured,
      trending,
      newest,
      topCreators,
      categories: categories
        .map((c) => ({
          key: c.category,
          count: c._count._all,
          sales: c._sum.saleCount ?? 0,
          label: CATEGORY_MAP[c.category]?.label ?? c.category,
          hue: CATEGORY_MAP[c.category]?.hue ?? "#00ff9d",
          icon: CATEGORY_MAP[c.category]?.icon ?? "Sparkles",
        }))
        .sort((a, b) => b.count - a.count),
      stats: {
        projects: stats[0],
        creators: stats[1],
        sales: stats[2]._count._all,
        volumeCents: stats[2]._sum.amountCents ?? 0,
        paidOutCents: stats[3]._sum.totalEarningsCents ?? 0,
      },
    };
  }, ["landing"]);
}

export async function getCategorySpotlight() {
  const rows = await prisma.project.groupBy({
    by: ["category"],
    where: { status: "published" },
    _sum: { saleCount: true, viewCount: true },
  });
  return rows;
}

export async function getTagCloud(limit = 24) {
  const rows = await prisma.tag.groupBy({
    by: ["name"],
    _count: { _all: true },
    orderBy: { _count: { name: "desc" } },
    take: limit,
  });
  return rows.map((r) => ({ name: r.name, count: r._count._all }));
}

/* --------------------------------------------------------------- creators */

export async function getCreatorByHandle(handle: string) {
  return prisma.user.findUnique({
    where: { handle },
    select: {
      id: true,
      handle: true,
      displayName: true,
      avatarUrl: true,
      coverUrl: true,
      bio: true,
      location: true,
      website: true,
      github: true,
      twitter: true,
      discord: true,
      isCreator: true,
      verified: true,
      reputation: true,
      ratingAvg: true,
      ratingCount: true,
      totalSales: true,
      totalEarningsCents: true,
      createdAt: true,
      _count: { select: { projects: true, followers: true, following: true } },
    },
  });
}

export async function getCreatorProjects(handle: string, sort: DiscoveryInput["sort"] = "trending") {
  return prisma.project.findMany({
    where: { creator: { handle }, status: { not: "draft" } },
    orderBy: orderByFor[sort] ?? orderByFor.trending,
    select: projectCardSelect,
  });
}

export async function getCreatorReviews(handle: string, take = 6) {
  return prisma.review.findMany({
    where: { author: { handle } },
    orderBy: { createdAt: "desc" },
    take,
    include: {
      author: { select: { id: true, handle: true, displayName: true, avatarUrl: true, verified: true } },
      project: { select: { slug: true, title: true } },
    },
  });
}

export async function listCreators(options: { sort?: string; page?: number; perPage?: number; q?: string } = {}) {
  const perPage = options.perPage ?? 12;
  const page = options.page ?? 1;
  const orderBy: Prisma.UserOrderByWithRelationInput[] =
    options.sort === "newest"
      ? [{ createdAt: "desc" }]
      : options.sort === "sales"
        ? [{ totalSales: "desc" }]
        : [{ totalEarningsCents: "desc" }];

  const where: Prisma.UserWhereInput = { isCreator: true };
  if (options.q) {
    where.OR = [
      { displayName: { contains: options.q } },
      { handle: { contains: options.q.toLowerCase() } },
      { bio: { contains: options.q } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy,
      skip: (page - 1) * perPage,
      take: perPage,
      select: {
        ...creatorCardSelect,
        reputation: true,
        totalSales: true,
        totalEarningsCents: true,
        ratingAvg: true,
        ratingCount: true,
        location: true,
        createdAt: true,
        _count: { select: { projects: true, followers: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return { items, total, page, pages: Math.max(1, Math.ceil(total / perPage)) };
}

/* -------------------------------------------------------------- dashboard */

export async function getDashboardStats(creatorId: string) {
  const since = new Date(Date.now() - 29 * 86400000);
  const [orders, previousOrders, projects, revenueRows, views, offers, pendingReviews, topProjects] = await Promise.all([
    prisma.order.findMany({
      where: { sellerId: creatorId, status: "paid", createdAt: { gte: since } },
      select: { amountCents: true, sellerPayoutCents: true, platformFeeCents: true, createdAt: true, projectId: true },
    }),
    prisma.order.findMany({
      where: {
        sellerId: creatorId,
        status: "paid",
        createdAt: { gte: new Date(Date.now() - 59 * 86400000), lt: since },
      },
      select: { sellerPayoutCents: true },
    }),
    prisma.project.findMany({
      where: { creatorId },
      select: {
        id: true,
        slug: true,
        title: true,
        status: true,
        priceCents: true,
        currency: true,
        saleCount: true,
        viewCount: true,
        likeCount: true,
        ratingAvg: true,
        ratingCount: true,
        trendingScore: true,
        featured: true,
        coverImage: true,
        category: true,
        publishedAt: true,
        updatedAt: true,
        _count: { select: { reviews: true } },
      },
      orderBy: { saleCount: "desc" },
    }),
    prisma.transaction.findMany({
      where: { userId: creatorId, type: "sale", status: "confirmed" },
      orderBy: { createdAt: "desc" },
      take: 400,
      select: { amountCents: true, currency: true, createdAt: true },
    }),
    prisma.analyticsEvent.groupBy({
      by: ["createdAt"],
      where: {
        project: { creatorId },
        createdAt: { gte: new Date(Date.now() - 29 * 86400000) },
      },
      _count: { _all: true },
    }),
    prisma.offer.count({ where: { project: { creatorId }, status: "pending" } }),
    prisma.order.count({
      where: { buyerId: creatorId, status: "paid", review: null },
    }),
    getTopProjects(creatorId),
  ]);

  const gross = orders.reduce((acc, o) => acc + o.amountCents, 0);
  const net = orders.reduce((acc, o) => acc + o.sellerPayoutCents, 0);
  const fees = orders.reduce((acc, o) => acc + o.platformFeeCents, 0);
  const previousNet = previousOrders.reduce((acc, o) => acc + o.sellerPayoutCents, 0);

  return {
    totals: {
      revenueCents: net,
      grossCents: gross,
      feesCents: fees,
      sales: orders.length,
      avgOrderCents: orders.length ? Math.round(gross / orders.length) : 0,
      pendingOffers: offers,
      awaitReviews: pendingReviews,
      liveProjects: projects.filter((p) => p.status === "published").length,
      totalProjects: projects.length,
      prevRevenueCents: previousNet,
    },
    projects,
    topProjects,
    revenueRows,
    viewRows: views,
  };
}

/** Projects ranked by realised revenue for a creator. */
async function getTopProjects(creatorId: string) {
  const rows = await prisma.project.findMany({
    where: { creatorId },
    select: { id: true, title: true, slug: true, coverImage: true },
  });
  if (!rows.length) return [];

  const grouped = await prisma.order.groupBy({
    by: ["projectId"],
    where: { sellerId: creatorId, status: "paid", projectId: { in: rows.map((r) => r.id) } },
    _sum: { sellerPayoutCents: true },
    _count: { _all: true },
  });

  const map = new Map(rows.map((r) => [r.id, r]));
  return grouped
    .map((g) => {
      const project = map.get(g.projectId);
      if (!project) return null;
      return { project, revenue: g._sum.sellerPayoutCents ?? 0, sales: g._count._all };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .sort((a, b) => b.revenue - a.revenue);
}

/* ------------------------------------------------------------------ sales */

export async function getSales(creatorId: string, page = 1, perPage = 15) {
  const [items, total, sum] = await Promise.all([
    prisma.order.findMany({
      where: { sellerId: creatorId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      select: {
        id: true,
        reference: true,
        amountCents: true,
        sellerPayoutCents: true,
        platformFeeCents: true,
        currency: true,
        chain: true,
        status: true,
        txHash: true,
        createdAt: true,
        project: { select: { title: true, slug: true, coverImage: true } },
        buyer: { select: { handle: true, displayName: true, avatarUrl: true } },
      },
    }),
    prisma.order.count({ where: { sellerId: creatorId } }),
    prisma.order.aggregate({ where: { sellerId: creatorId, status: "paid" }, _sum: { sellerPayoutCents: true } }),
  ]);
  return { items, total, page, pages: Math.max(1, Math.ceil(total / perPage)), sumCents: sum._sum.sellerPayoutCents ?? 0 };
}

/* ------------------------------------------------------------ meta / facets */

export async function getFacetValues() {
  const [languages, licenses, priceRange] = await Promise.all([
    prisma.project.groupBy({ by: ["language"], where: { status: "published" }, _count: { _all: true } }),
    prisma.project.groupBy({ by: ["license"], where: { status: "published" }, _count: { _all: true } }),
    prisma.project.aggregate({ where: { status: "published" }, _min: { priceCents: true }, _max: { priceCents: true } }),
  ]);

  return {
    languages: languages
      .filter((l) => l.language)
      .map((l) => ({ value: l.language as string, count: l._count._all }))
      .sort((a, b) => b.count - a.count),
    licenses: licenses.map((l) => ({
      value: l.license,
      label: LICENSE_MAP[l.license] ?? l.license,
      count: l._count._all,
    })),
    chains: CHAIN_KEYS,
    tokens: TOKENS.map((t) => t.symbol),
    memes: MEME_SYMBOLS,
    sorts: SORTS,
    priceMin: priceRange._min.priceCents ?? 0,
    priceMax: priceRange._max.priceCents ?? 100_000,
  };
}


/**
 * Serialises a project row into the shape consumed by client components.
 *
 * Only fields that a card, rail or buy box actually reads are included — the
 * result is serialised into the RSC payload and every API response, so each
 * dropped field is a saved byte on every listing on every page.
 */
export function toCardData(project: {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  summary: string | null;
  category: string;
  tagsString: string;
  language: string | null;
  license: string;
  priceCents: number;
  originalPriceCents: number | null;
  currency: string;
  chain: string;
  acceptsOffers: boolean;
  acceptsMeme: boolean;
  memeToken: string | null;
  coverImage: string | null;
  saleCount: number;
  likeCount: number;
  viewCount: number;
  ratingAvg: number;
  ratingCount: number;
  trendingScore: number;
  featured: boolean;
  publishedAt: Date | string | null;
  createdAt: Date | string;
  creator: { id: string; handle: string; displayName: string; avatarUrl: string | null; verified: boolean; bio?: string | null };
  _count?: { assets: number; reviews: number };
}) {
return {
    id: project.id,
    slug: project.slug,
    title: project.title,
    tagline: project.tagline,
    category: project.category,
    categoryLabel: CATEGORY_MAP[project.category]?.label ?? project.category,
    hue: CATEGORY_MAP[project.category]?.hue ?? "#00ff9d",
    tags: parseTags(project.tagsString, 4),
    priceCents: project.priceCents,
    originalPriceCents: project.originalPriceCents,
    discount:
      project.originalPriceCents && project.originalPriceCents > project.priceCents
        ? Math.round((1 - project.priceCents / project.originalPriceCents) * 100)
        : 0,
    currency: project.currency,
    acceptsMeme: project.acceptsMeme,
    memeToken: project.memeToken,
    coverImage: project.coverImage,
    saleCount: project.saleCount,
    likeCount: project.likeCount,
    viewCount: project.viewCount,
    ratingAvg: project.ratingAvg,
    ratingCount: project.ratingCount,
    featured: project.featured,
    creator: {
      handle: project.creator.handle,
      displayName: project.creator.displayName,
      avatarUrl: project.creator.avatarUrl,
      verified: project.creator.verified,
    },
  };
}

export type CardData = ReturnType<typeof toCardData>;

export function licenseTierPrice(baseCents: number, multiplier: number) {
  return Math.round(baseCents * multiplier);
}

export function checkoutMath(priceCents: number, licenseMultiplier = 1) {
  const gross = licenseTierPrice(priceCents, licenseMultiplier);
  const fee = gross === 0 ? 0 : feeFromCents(gross);
  return { grossCents: gross, feeCents: fee, payoutCents: gross - fee, totalCents: gross + fee };
}
