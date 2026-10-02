import type { Metadata } from "next";
import { GitCommitVertical, Sparkles, Zap } from "lucide-react";
import { Container, PageHeader } from "@/components/ui/section";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/ui/motion";

export const metadata: Metadata = {
  title: "Changelog",
  description: "What shipped on NEXUS recently.",
};

const RELEASES = [
  {
    version: "v1.4.0",
    date: "This week",
    highlight: true,
    title: "Memecoin rails and instant payouts",
    body: "Listings can opt into PEPE, WIF, BONK and SHIB settlement alongside stablecoins. Payout addresses are per-wallet, per-network, and land within a block of settlement.",
    items: [
      "Per-listing memecoin opt-in with an explicit volatility warning at checkout",
      "Payout routing per chain instead of a single global address",
      "Signed download receipts recorded in the public transaction ledger",
    ],
  },
  {
    version: "v1.3.0",
    date: "2 weeks ago",
    title: "Offers that convert",
    body: "Offers now lock a price on acceptance and open a 30-minute checkout window, so an accepted negotiation is a sale rather than a promise.",
    items: [
      "Accepting an offer reserves the listing price for the buyer",
      "Offer inbox with expiry countdowns and one-tap decline",
      "Reputation bumps for creators who answer within the window",
    ],
  },
  {
    version: "v1.2.0",
    date: "Last month",
    title: "Discovery rebuilt",
    body: "Trending now blends recency-weighted views, sales velocity and review quality instead of raw lifetime totals.",
    items: ["Velocity-based trending recomputed nightly", "Stack and licence facets", "Faster faceted search on the explore page"],
  },
  {
    version: "v1.1.0",
    date: "2 months ago",
    title: "Wallet sign-in",
    body: "Sign in by signing a message. No gas, no approvals, no seed phrase ever touches the server.",
    items: ["EIP-4361 style nonce + message verification", "One address belongs to one account", "Demo wallet for exploring without an extension"],
  },
  {
    version: "v1.0.0",
    date: "Public beta",
    title: "The marketplace opens",
    body: "Listings, checkout, licences, reviews, dashboards and the ledger - the full loop, end to end.",
    items: ["8% flat platform fee", "30-day refund window", "First-party analytics only, no third-party pixels"],
  },
];

export default function ChangelogPage() {
  return (
    <Container className="pb-24">
      <PageHeader
        eyebrow={
          <>
            <GitCommitVertical className="size-3" /> Releases
          </>
        }
        title="Changelog"
        description="What shipped, and why. Reverse-chronological."
      />

      <div className="relative space-y-5 pl-6">
        <span className="absolute left-[7px] top-2 h-full w-px bg-linear-to-b from-neon-400/50 via-white/10 to-transparent" />

        {RELEASES.map((release, i) => (
          <Reveal key={release.version} delay={i * 0.05}>
            <div className="relative">
              <span
                className={`absolute -left-6 top-5 grid size-[15px] place-items-center rounded-full border-2 ${
                  release.highlight ? "border-neon-400 bg-neon-400/30" : "border-ink-600 bg-void"
                }`}
              />
              <article className={`glass rounded-2xl p-5 sm:p-6 ${release.highlight ? "border-neon-400/25" : ""}`}>
                <div className="flex flex-wrap items-center gap-2.5">
                  <Badge tone={release.highlight ? "neon" : "glass"}>{release.version}</Badge>
                  <span className="text-[11.5px] text-mist-500">{release.date}</span>
                  {release.highlight ? (
                    <Badge tone="violet">
                      <Sparkles className="size-3" />
                      Latest
                    </Badge>
                  ) : null}
                </div>
                <h2 className="mt-3 text-[17px] font-semibold">{release.title}</h2>
                <p className="mt-2 text-[13.5px] leading-relaxed text-mist-400">{release.body}</p>
                <ul className="mt-4 space-y-1.5">
                  {release.items.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-[12.5px] text-mist-300">
                      <Zap className="mt-0.5 size-3 shrink-0 text-neon-400/70" />
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          </Reveal>
        ))}
      </div>
    </Container>
  );
}