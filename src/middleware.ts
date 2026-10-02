import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

/*
 * Runs on the Node.js runtime rather than Edge.
 *
 * `jose` pulls in CompressionStream/DecompressionStream for JWE zip, which the
 * Edge runtime does not implement — that produced a build warning and shipped
 * dead code into the middleware bundle. Node.js middleware is stable in Next 15.5,
 * and it means one crypto implementation across middleware and route handlers.
 */
export const runtime = "nodejs";

const SESSION_COOKIE = "nexus_session";
const PUBLIC_PREFIXES = [
  "/api/auth",
  "/api/projects",
  "/api/creators",
  "/api/analytics",
  "/api/cron",
];

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) {
    return new TextEncoder().encode("dev-only-secret-change-me-nexus-marketplace-0123456789");
  }
  return new TextEncoder().encode(value);
}

/**
 * Edge gate for gated surfaces. Verifies the session JWT (no database access)
 * and redirects anonymous visitors. API routes still enforce authorisation on
 * the server - this exists purely to avoid flashing private pages.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;

  let authenticated = false;
  if (token) {
    try {
      await jwtVerify(token, secret(), { issuer: "nexus", audience: "nexus-web" });
      authenticated = true;
    } catch {
      authenticated = false;
    }
  }

  if (!authenticated) {
    if (pathname.startsWith("/api/") && !PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
      return NextResponse.json(
        { ok: false, error: { message: "Sign in to continue.", code: "unauthorized" } },
        { status: 401 },
      );
    }
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname + req.nextUrl.search)}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/checkout/:path*",
    "/library/:path*",
    "/transactions/:path*",
    "/offers/:path*",
    "/api/checkout/:path*",
    "/api/transactions/:path*",
    "/api/dashboard/:path*",
    "/api/me/:path*",
    "/api/offers/:path*",
    "/api/orders/:path*",
    "/api/reviews/:path*",
  ],
};