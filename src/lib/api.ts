import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { ApiError } from "./api-error";
import { headers } from "next/headers";

/* ----------------------------------------------------------- rate limiting */

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

/** In-memory limiter. Swap for Redis/Upstash when running more than one instance. */
export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, resetAt: now + windowMs };
  }
  bucket.count += 1;
  return { ok: bucket.count <= limit, remaining: Math.max(0, limit - bucket.count), resetAt: bucket.resetAt };
}

/** Best-effort client identity: session id, then forwarded IP. */
export async function clientKey(scope: string) {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "local";
  return `${scope}:${ip}`;
}

/* ---------------------------------------------------------------- responses */

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, { status: 200, ...init });
}

export function created<T>(data: T) {
  return NextResponse.json({ ok: true, data }, { status: 201 });
}

export function fail(message: string, status = 400, code?: string, details?: unknown) {
  return NextResponse.json({ ok: false, error: { message, code, details } }, { status });
}

/** Wraps a route handler with error normalisation + per-route rate limiting. */
export function route<Args extends unknown[]>(
  handler: (...args: Args) => Promise<Response>,
  options: { limit?: number; windowMs?: number; scope?: string } = {},
) {
  return async (...args: Args) => {
    try {
      if (options.limit) {
        const key = await clientKey(options.scope ?? "global");
        const result = rateLimit(key, options.limit, options.windowMs ?? 60_000);
        if (!result.ok) {
          return fail("Too many requests. Try again shortly.", 429, "rate_limited", {
            retryAfterMs: result.resetAt - Date.now(),
          });
        }
      }
      return await handler(...args);
    } catch (err) {
      if (err instanceof ApiError) return fail(err.message, err.status, err.code, err.details);
      if (err instanceof ZodError) {
        return fail("Please fix the highlighted fields.", 422, "validation", err.issues);
      }
      if (process.env.NODE_ENV !== "production") console.error("[api]", err);
      return fail("Something went wrong on our side.", 500, "internal");
    }
  };
}

export async function parseBody<T>(req: Request, schema: ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw ApiError.badRequest("Expected a JSON body.");
  }
  return schema.parse(raw);
}

export function parseIntParam(value: string | null, fallback: number, min = -Infinity, max = Infinity) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(Math.round(n), min), max);
}

/** Stable hash used for analytics / rate-limit buckets without storing raw IPs. */
export async function anonymize(value: string) {
  const salt = process.env.AUTH_SECRET ?? "nexus";
  const data = new TextEncoder().encode(`${salt}:${value}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .slice(0, 8)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}