import { after } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Write-side effects that must not delay a response.
 *
 * `after()` runs the callback once the response has been flushed, so analytics
 * and counter updates never sit in front of TTFB. Failures are swallowed on
 * purpose: a dropped view count is not worth a failed page render.
 */

export function trackView(projectId: string, userId: string | null, path: string) {
  after(async () => {
    try {
      await prisma.$transaction([
        prisma.project.update({ where: { id: projectId }, data: { viewCount: { increment: 1 } } }),
        prisma.analyticsEvent.create({
          data: { type: "view", projectId, userId, path },
        }),
      ]);
    } catch {
      /* analytics must never surface to the visitor */
    }
  });
}

/** Refreshes a cached aggregate after a write so the next read is accurate. */
export function refreshTrendingInBackground(projectIds: string[]) {
  if (!projectIds.length) return;
  after(async () => {
    try {
      const { recomputeTrending } = await import("@/lib/analytics");
      await recomputeTrending();
    } catch {
      /* the nightly cron is the backstop */
    }
  });
}