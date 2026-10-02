import { route, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { getDashboardStats, getSales } from "@/lib/queries";
import { parseIntParam } from "@/lib/api";
import { prisma } from "@/lib/db";
import { bustCache } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Everything the creator dashboard renders, in one round trip. */
export const GET = route(
  async (req: Request) => {
    const user = await requireUser();
    const url = new URL(req.url);
    const page = parseIntParam(url.searchParams.get("page"), 1, 1, 200);

    const [stats, sales, notifications, purchases] = await Promise.all([
      getDashboardStats(user.id),
      getSales(user.id, page, 10),
      prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      prisma.order.findMany({
        where: { buyerId: user.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          reference: true,
          status: true,
          amountCents: true,
          currency: true,
          createdAt: true,
          project: { select: { title: true, slug: true, coverImage: true } },
          review: { select: { id: true } },
        },
      }),
    ]);

    bustCache(`dashboard:${user.id}`);

    return ok({ ...stats, sales, notifications, purchases });
  },
  { limit: 120, windowMs: 30_000, scope: "dashboard" },
);