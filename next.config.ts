import type { NextConfig } from "next";

/** One year: the filenames are content-hashed, so they can never go stale. */
const IMMUTABLE = "public, max-age=31536000, immutable";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion", "recharts"],
  },

  images: {
    // AVIF first with WebP fallback — roughly 50-70% smaller than the source JPEG.
    formats: ["image/avif", "image/webp"],
    // Trim the breakpoint ladder: fewer widths means fewer cached variants and
    // fewer wasted bytes on phones that never render a 3840px card.
    deviceSizes: [384, 640, 828, 1080, 1440, 1920],
    imageSizes: [48, 64, 96, 128, 256, 384],
    // Every quality that any component actually requests. Next refuses to encode
    // anything outside this list, so it is also the set of cached variants.
    qualities: [55, 60],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "cdn.discordapp.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },

      /* ---------------------------------------------------- hashed build output */
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: IMMUTABLE },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
      {
        source: "/_next/image",
        headers: [{ key: "Cache-Control", value: IMMUTABLE }],
      },
      {
        source: "/_next/data/:path*",
        headers: [{ key: "Cache-Control", value: IMMUTABLE }],
      },
      {
        // Self-hosted webfonts: content-hashed by next/font.
        source: "/_next/static/media/:path*",
        headers: [{ key: "Cache-Control", value: IMMUTABLE }],
      },

      /* --------------------------------------------------- public read APIs */
      // Safe to cache at the edge: pure reads with no session dependency.
      {
        source: "/api/projects",
        headers: [
          { key: "Cache-Control", value: "public, s-maxage=30, stale-while-revalidate=120" },
        ],
      },
      {
        source: "/api/creators",
        headers: [
          { key: "Cache-Control", value: "public, s-maxage=60, stale-while-revalidate=300" },
        ],
      },
      {
        source: "/api/creators/:handle",
        headers: [
          { key: "Cache-Control", value: "public, s-maxage=60, stale-while-revalidate=300" },
        ],
      },
      {
        source: "/api/projects/:id",
        headers: [
          { key: "Cache-Control", value: "public, s-maxage=30, stale-while-revalidate=120" },
        ],
      },

      /* ------------------------------------ authenticated APIs: never cached */
      {
        source: "/api/checkout/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store, max-age=0" }],
      },
      {
        source: "/api/transactions",
        headers: [{ key: "Cache-Control", value: "private, no-store, max-age=0" }],
      },
      {
        source: "/api/dashboard/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store, max-age=0" }],
      },
      {
        source: "/api/me/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store, max-age=0" }],
      },
      {
        source: "/api/orders/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store, max-age=0" }],
      },
      {
        source: "/api/auth/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store, max-age=0" }],
      },
      {
        source: "/api/offers/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store, max-age=0" }],
      },
      {
        source: "/api/reviews",
        headers: [{ key: "Cache-Control", value: "private, no-store, max-age=0" }],
      },
      {
        source: "/api/analytics/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }],
      },
      {
        source: "/api/cron/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }],
      },
    ];
  },

  async redirects() {
    return [
      { source: "/projects", destination: "/explore", permanent: true },
      { source: "/creators", destination: "/explore/creators", permanent: true },    ];
  },
};

export default nextConfig;