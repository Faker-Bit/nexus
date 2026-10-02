import { route, ok, fail } from "@/lib/api";
import { recomputeTrending } from "@/lib/analytics";
import { prisma } from "@/lib/db";
import { bustCache } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Nightly job: refresh trending scores.
 *
 * Vercel Cron (see vercel.json) calls this on a schedule but cannot send custom
 * headers, so `x-cron-secret` only applies when you trigger it yourself with curl:
 *   curl -H "x-cron-secret: $CRON_SECRET" https://your-host/api/cron/trending
 * With no secret configured the route is open — acceptable for a job that only
 * recomputes a public ranking, but set one for anything load-bearing.
 */
export const GET = route(
  async (req: Request) => {
    const secret = process.env.CRON_SECRET;
    if (secret) {
      const provided = req.headers.get("x-cron-secret");
      if (provided !== secret) {
        return fail("Invalid cron secret.", 401, "unauthorized");
      }
    }

    const updated = await recomputeTrending();
    const projects = await prisma.project.count({ where: { status: "published" } });
    bustCache("landing");

    return ok({ updated, projects, ranAt: new Date().toISOString() });
  },
  { limit: 12, windowMs: 60_000, scope: "cron" },
);