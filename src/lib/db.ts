import { PrismaClient } from "@prisma/client";
import { unstable_cache } from "next/cache";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * Vercel runs each route in its own lambda, so every cold start opens a fresh
 * database connection. A direct Postgres URL will exhaust the connection limit
 * well before any real traffic, so the pooled form is required in production.
 * This is a warning rather than a hard failure so a first deploy still works.
 */
function warnAboutUnpooledConnection() {
  if (process.env.NODE_ENV !== "production") return;
  const url = process.env.DATABASE_URL ?? "";
  if (!url.startsWith("postgres")) return;
  const pooled =
    url.includes("pgbouncer=true") ||
    url.includes("pooler") ||
    url.includes("-pool") ||
    url.includes(":6543") ||
    url.includes("?pool=true");
  if (!pooled) {
    console.warn(
      "[db] DATABASE_URL does not look pooled. On serverless this will exhaust the Postgres " +
        "connection limit. Use the Neon pooler / Supabase pooler URL (or append ?pgbouncer=true).",
    );
  }
}

if (process.env.NEXT_RUNTIME === "nodejs") warnAboutUnpooledConnection();

/**
 * Vercel gives each route its own lambda, so connection pressure is handled at
 * the database level with a pooled `DATABASE_URL` (see warnAboutUnpooledConnection)
 * rather than by shrinking Prisma's own pool per instance.
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * Read-through cache for hot, read-mostly queries.
 *
 * In development an in-process map is enough. In production this wraps
 * `unstable_cache`, so the same data is stored in the Next data cache and shared
 * across every server instance — the previous version silently skipped caching in
 * production, which meant a full table scan on every page request.
 *
 * `tags` allow targeted invalidation from write routes.
 */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>,
  tags: string[] = [],
): Promise<T> {
  if (process.env.NODE_ENV === "production") {
    return unstable_cache(fn, [key], {
      revalidate: ttlSeconds,
      tags: ["nexus", ...tags],
    })() as Promise<T>;
  }

  if (!devCache.has(key)) devCache.set(key, { at: Date.now(), value: await fn() });
  const hit = devCache.get(key)!;
  if (Date.now() - hit.at > ttlSeconds * 1000) {
    devCache.set(key, { at: Date.now(), value: await fn() });
    return devCache.get(key)!.value as T;
  }
  return hit.value as T;
}

const devCache = new Map<string, { at: number; value: unknown }>();

export function bustCache(prefix?: string) {
  if (process.env.NODE_ENV === "production") {
    // Production invalidation goes through revalidateTag at the write sites.
    return;
  }
  if (!prefix) {
    devCache.clear();
    return;
  }
  for (const key of devCache.keys()) if (key.startsWith(prefix)) devCache.delete(key);
}