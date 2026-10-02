import { headers } from "next/headers";
import { route, ok, parseBody } from "@/lib/api";
import { z } from "zod";
import { recordEvent } from "@/lib/analytics";
import { loadUser } from "@/lib/auth";
import { anonymize } from "@/lib/api";

const trackSchema = z.object({
  type: z.enum(["view", "click", "like", "share", "checkout_start", "download", "search", "offer"]),
  projectId: z.string().cuid().optional().nullable(),
  path: z.string().trim().max(200).optional().nullable(),
  q: z.string().trim().max(120).optional().nullable(),
});

/**
 * First-party analytics. No third-party pixels, no cross-site tracking:
 * a salted hash of the request IP stands in as the session identifier.
 */
export const POST = route(
  async (req: Request) => {
    const body = await parseBody(req, trackSchema);
    const user = await loadUser();
    const h = await headers();
    const sessionId = await anonymize(h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? "local");

    await recordEvent({
      type: body.type,
      projectId: body.projectId ?? null,
      userId: user?.id ?? null,
      sessionId,
      path: body.path ?? null,
      referrer: h.get("referer"),
      meta: body.q ? { q: body.q } : null,
    });

    return ok({ recorded: true });
  },
  { limit: 240, windowMs: 60_000, scope: "track" },
);