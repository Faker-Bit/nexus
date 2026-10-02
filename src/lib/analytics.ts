import { prisma } from "@/lib/db";

/**
 * Lightweight analytics writes. Events are aggregated nightly by the
 * `recomputeTrending` job; recording here stays fire-and-forget.
 */

export type AnalyticsType =
  | "view"
  | "click"
  | "like"
  | "share"
  | "checkout_start"
  | "download"
  | "search"
  | "offer";

const ALLOWED: AnalyticsType[] = ["view", "click", "like", "share", "checkout_start", "download", "search", "offer"];

export async function recordEvent(input: {
  type: AnalyticsType;
  projectId?: string | null;
  userId?: string | null;
  sessionId?: string | null;
  path?: string | null;
  referrer?: string | null;
  meta?: Record<string, unknown> | null;
}) {
  if (!ALLOWED.includes(input.type)) return null;
  try {
    return await prisma.analyticsEvent.create({
      data: {
        type: input.type,
        projectId: input.projectId ?? null,
        userId: input.userId ?? null,
        sessionId: input.sessionId ?? null,
        path: input.path ?? null,
        referrer: input.referrer ?? null,
        meta: input.meta ? JSON.stringify(input.meta).slice(0, 500) : null,
      },
      select: { id: true },
    });
  } catch {
    // Analytics must never break a user-facing request.
    return null;
  }
}

/** Fire-and-forget view counter. */
export async function recordView(projectId: string, userId: string | null, sessionId: string | null) {
  await Promise.all([
    prisma.project.update({ where: { id: projectId }, data: { viewCount: { increment: 1 } } }).catch(() => null),
    recordEvent({ type: "view", projectId, userId, sessionId }),
  ]);
}

/**
 * Recency-weighted popularity. Called by the nightly cron route so the
 * "trending" rail reflects velocity instead of all-time totals.
 */
export async function recomputeTrending() {
  const since = new Date(Date.now() - 7 * 86400000);
  const [recentViews, recentSales] = await Promise.all([
    prisma.analyticsEvent.groupBy({
      by: ["projectId"],
      where: { type: "view", createdAt: { gte: since }, projectId: { not: null } },
      _count: { _all: true },
    }),
    prisma.order.groupBy({
      by: ["projectId"],
      where: { status: "paid", createdAt: { gte: since } },
      _count: { _all: true },
      _sum: { amountCents: true },
    }),
  ]);

  const viewMap = new Map(recentViews.map((r) => [r.projectId!, r._count._all]));
  const saleMap = new Map(recentSales.map((r) => [r.projectId!, r]));

  const projects = await prisma.project.findMany({
    where: { status: "published" },
    select: { id: true, saleCount: true, likeCount: true, ratingAvg: true },
  });

  let updates = 0;
  for (const project of projects) {
    const views = viewMap.get(project.id) ?? 0;
    const sale = saleMap.get(project.id);
    const sales = sale?._count._all ?? 0;
    const revenue = sale?._sum.amountCents ?? 0;

    const score =
      views * 0.12 +
      sales * 8 +
      (revenue / 100) * 0.08 +
      project.likeCount * 0.6 +
      (project.ratingAvg ?? 0) * 4 +
      project.saleCount * 0.05;

    const rounded = Math.round(score * 100) / 100;
    if (Math.abs(rounded - project.saleCount * 0.05) > 0.001) {
      await prisma.project.update({ where: { id: project.id }, data: { trendingScore: rounded } });
      updates++;
    }
  }

  return updates;
}