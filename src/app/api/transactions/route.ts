import { prisma } from "@/lib/db";
import { route, ok, parseIntParam } from "@/lib/api";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Unified ledger: purchases, sales, fees and refunds for the signed-in user. */
export const GET = route(
  async (req: Request) => {
    const user = await requireUser();
    const url = new URL(req.url);
    const scope = url.searchParams.get("scope") ?? "all";
    const page = parseIntParam(url.searchParams.get("page"), 1, 1, 500);
    const perPage = parseIntParam(url.searchParams.get("perPage"), 20, 1, 60);

    const where =
      scope === "purchases"
        ? { userId: user.id, type: "purchase" }
        : scope === "sales"
          ? { userId: user.id, type: "sale" }
          : { userId: user.id };

    const [items, total, totals] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
        include: {
          order: {
            select: {
              reference: true,
              status: true,
              project: { select: { title: true, slug: true } },
              buyer: { select: { handle: true, displayName: true } },
              seller: { select: { handle: true, displayName: true } },
            },
          },
        },
      }),
      prisma.transaction.count({ where }),
      prisma.transaction.groupBy({
        by: ["type", "direction"],
        where: { userId: user.id, status: "confirmed" },
        _sum: { amountCents: true },
        _count: { _all: true },
      }),
    ]);

    return ok({
      items,
      total,
      page,
      pages: Math.max(1, Math.ceil(total / perPage)),
      totals,
    });
  },
  { limit: 120, windowMs: 60_000, scope: "transactions" },
);