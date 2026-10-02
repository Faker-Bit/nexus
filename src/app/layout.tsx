import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { RouteProgress } from "@/components/layout/route-progress";
import { AmbientBackdrop } from "@/components/three/ambient-backdrop";
import { CursorGlow, ScrollProgress } from "@/components/ui/effects";

/*
 * Font strategy
 * --------------
 * Three families are in the design, so all three stay. What changes is *when* and
 * *what* they cost:
 *  - `subsets: ["latin"]` keeps only the Latin cut instead of the full unicode range.
 *  - `adjustFontFallback` generates a local fallback face, so swapping to the webfont
 *    on late load causes no reflow (CLS stays at 0).
 *  - Only the body face is preloaded. Space Grotesk and JetBrains Mono load lazily via
 *    their own unicode-range rules and never compete with LCP for bandwidth.
 *  - The display face is restricted to the weights actually used (500/600/700), which
 *    turns the variable font into a much smaller static file.
 */

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
  adjustFontFallback: true,
  fallback: ["system-ui", "Segoe UI", "Helvetica Neue", "Arial", "sans-serif"],
});

const space = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  display: "swap",
  preload: false,
  adjustFontFallback: true,
  weight: ["500", "600", "700"],
  fallback: ["system-ui", "Segoe UI", "Helvetica Neue", "Arial", "sans-serif"],
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-jb",
  display: "swap",
  preload: false,
  adjustFontFallback: true,
  weight: ["400", "600"],
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "NEXUS - The marketplace where builders get paid",
    template: "%s · NEXUS",
  },
  description:
    "NEXUS is the premium marketplace for developer and creator work: code, apps, websites, bots, AI agents, scripts and datasets. Buy with crypto, sell globally, get paid on-chain.",
  keywords: [
    "developer marketplace",
    "sell code online",
    "AI agents for sale",
    "crypto payments",
    "open source templates",
    "Web3 marketplace",
    "creator economy",
  ],
  authors: [{ name: "NEXUS" }],
  openGraph: {
    type: "website",
    siteName: "NEXUS",
    title: "NEXUS - The marketplace where builders get paid",
    description:
      "Showcase, share and sell code, apps, bots, AI tools and digital projects. Instant crypto settlement, verified creators, real reviews.",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "NEXUS - The marketplace where builders get paid",
    description: "Sell code, apps, bots, AI agents and digital projects. Get paid in crypto, instantly.",
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon.png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#020805",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${space.variable} ${mono.variable}`} suppressHydrationWarning>
      <body className="min-h-dvh bg-void text-mist-200 antialiased">
        <Providers>
          <AmbientBackdrop />
          <CursorGlow />
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-neon-400 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-void"
          >
            Skip to content
          </a>
          <RouteProgress />
          <ScrollProgress />
          <SiteHeader />
          <main id="main" className="relative z-10 min-h-[70dvh]">
            {children}
          </main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}