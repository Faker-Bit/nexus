import Link from "next/link";
import { Globe2, Send } from "lucide-react";
import { CATEGORIES } from "@/lib/constants";
import { Reveal } from "@/components/ui/motion";

function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 .5C5.73.5.5 5.73.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.55v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.71.08-.71 1.17.08 1.79 1.2 1.79 1.2 1.04 1.79 2.73 1.27 3.4.97.1-.76.41-1.28.74-1.57-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.3 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.8 1.18 1.84 1.18 3.1 0 4.43-2.69 5.4-5.25 5.69.42.36.79 1.07.79 2.16v3.2c0 .3.21.66.8.55A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
    </svg>
  );
}

function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.65l-5.22-6.82-5.96 6.82H1.68l7.73-8.84L1.25 2.25h6.82l4.71 6.23 5.46-6.23Zm-1.16 17.52h1.83L7.08 4.13H5.11l11.97 15.64Z" />
    </svg>
  );
}

const COLUMNS = [
  {
    title: "Marketplace",
    links: [
      { label: "Explore projects", href: "/explore" },
      { label: "Trending this week", href: "/explore?sort=trending" },
      { label: "New releases", href: "/explore?sort=newest" },
      { label: "Free & open", href: "/explore?free=1" },
      { label: "Top creators", href: "/explore/creators" },
    ],
  },
  {
    title: "Sell",
    links: [
      { label: "Start selling", href: "/register" },
      { label: "Creator dashboard", href: "/dashboard" },
      { label: "Pricing & fees", href: "/pricing" },
      { label: "Payouts", href: "/pricing#payouts" },
      { label: "Seller guide", href: "/pricing#guide" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "How NEXUS works", href: "/about" },
      { label: "Trust & safety", href: "/about#safety" },
      { label: "Licensing", href: "/about#licensing" },
      { label: "API docs", href: "/api-docs" },
      { label: "Changelog", href: "/changelog" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="cv-auto relative mt-24 border-t border-white/7 bg-ink-950/60">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-neon-400/40 to-transparent" />
      <div className="mx-auto max-w-[1400px] px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2.6fr]">
          <Reveal>
            <div>
              <Link href="/" className="flex items-center gap-2.5">
                <span className="relative grid size-9 place-items-center rounded-xl bg-linear-to-br from-neon-300 via-neon-400 to-violet-neon">
                  <span className="absolute inset-0 rounded-xl ring-1 ring-white/25" />
                  <svg viewBox="0 0 24 24" className="size-5 text-void" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
                    <path d="M4 20V4l16 16V4" />
                  </svg>
                </span>
                <span className="font-display text-[17px] font-bold text-mist-50">
                  NEXUS<span className="text-neon-400">.</span>
                </span>
              </Link>
              <p className="mt-4 max-w-sm text-[13.5px] leading-relaxed text-mist-400">
                The marketplace where developers and creators get paid for what they build. Code, apps, bots,
                AI agents, scripts and datasets - traded with verified buyers and settled on-chain.
              </p>
              <div className="mt-5 flex items-center gap-2">
                {[
                  { icon: GithubIcon, label: "GitHub", href: "https://github.com" },
                  { icon: XIcon, label: "X", href: "https://x.com" },
                  { icon: Send, label: "Discord", href: "https://discord.com" },
                  { icon: Globe2, label: "Status", href: "/status" },
                ].map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    aria-label={item.label}
                    className="grid size-9 place-items-center rounded-xl border border-white/10 bg-white/4 text-mist-400 transition-all hover:border-neon-400/40 hover:text-neon-300 hover:bg-neon-400/8"
                  >
                    <item.icon className="size-4" />
                  </Link>
                ))}
              </div>
            </div>
          </Reveal>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {COLUMNS.map((col, i) => (
              <Reveal key={col.title} delay={i * 0.06}>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mist-500">{col.title}</p>
                  <ul className="mt-4 space-y-2.5">
                    {col.links.map((link) => (
                      <li key={link.href + link.label}>
                        <Link
                          href={link.href}
                          className="group inline-flex items-center gap-1.5 text-[13.5px] text-mist-400 transition-colors hover:text-mist-50"
                        >
                          {link.label}
                          <span className="translate-x-0 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100">
                            <span className="text-neon-400">→</span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <div className="mt-12 border-t border-white/7 pt-7">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-mist-500">Browse categories</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.key}
                href={`/explore?category=${cat.key}`}
                className="group inline-flex items-center gap-1.5 rounded-full border border-white/8 bg-white/3 px-3 py-1.5 text-[12px] text-mist-400 transition-all hover:border-white/20 hover:text-mist-100"
              >
                <span className="size-1.5 rounded-full transition-shadow" style={{ background: cat.hue }} />
                {cat.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-white/7 pt-7 text-[12px] text-mist-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} NEXUS Labs. Built for people who ship.</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/terms" className="transition-colors hover:text-mist-200">Terms</Link>
            <Link href="/privacy" className="transition-colors hover:text-mist-200">Privacy</Link>
            <Link href="/cookies" className="transition-colors hover:text-mist-200">Cookies</Link>
            <Link href="/licenses" className="transition-colors hover:text-mist-200">License terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}