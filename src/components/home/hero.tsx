"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Wallet, Zap } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HeroCanvas } from "@/components/three/hero-canvas";
import { Magnetic, Reveal, CountUp } from "@/components/ui/motion";
import { RevealText } from "@/components/ui/effects";
import { Container } from "@/components/ui/section";

export function Hero({
  stats,
}: {
  stats: { projects: number; creators: number; sales: number; volumeCents: number };
}) {
  return (
    <section className="relative overflow-hidden pb-16 pt-10 sm:pt-16 lg:pb-24 lg:pt-24">
      <HeroCanvas className="pointer-events-none absolute inset-0 -z-10 opacity-90" particles={1800} bloom={1.05} />

      {/* scrim keeps headline legible over the scene */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(90%_70%_at_50%_45%,rgba(4,5,10,0.55),rgba(4,5,10,0.15)_45%,transparent_75%)]" />

      <Container>
        <div className="flex flex-col items-center text-center">
          <Reveal>
            <Link
              href="/changelog"
              className="group inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 py-1.5 pl-1.5 pr-3.5 text-[12.5px] transition-colors hover:border-neon-400/40"
            >
              <Badge tone="neon" size="sm" className="border-none bg-neon-400/16">
                <Sparkles className="size-3" />
                New
              </Badge>
              <span className="text-mist-300 transition-colors group-hover:text-mist-50">
                Instant on-chain payouts with memecoin rails
              </span>
              <ArrowRight className="size-3.5 text-mist-500 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Reveal>

          <Reveal delay={0.06}>
            <h1 className="mt-8 max-w-5xl text-[clamp(2.6rem,7.6vw,5.25rem)] font-semibold leading-[0.98] tracking-[-0.035em]">
              <RevealText className="text-gradient">
                Ship it.
              </RevealText>
              <br />
              <RevealText delay={0.16} className="text-mist-50">
                List it.
              </RevealText>{" "}
              <span className="relative inline-block">
                <RevealText delay={0.3} className="text-mist-50">
                  Get paid.
                </RevealText>
                <motion.span
                  className="pointer-events-none absolute inset-x-0 -bottom-1 h-px origin-left bg-linear-to-r from-transparent via-neon-400 to-transparent"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 1, delay: 1.15, ease: [0.16, 1, 0.3, 1] }}
                />
              </span>
            </h1>
          </Reveal>

          <Reveal delay={0.12}>
            <p className="mt-7 max-w-2xl text-balance text-[16px] leading-relaxed text-mist-300 sm:text-[17.5px]">
              The marketplace where developers and creators trade what they build — agents, bots, apps,
              templates, scripts and datasets. Verified buyers, real reviews, settlement on-chain in seconds.
            </p>
          </Reveal>

          <Reveal delay={0.18}>
            <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
              <Magnetic strength={0.22}>
                <ButtonLink href="/explore" size="xl" iconRight={<ArrowRight className="size-4 transition-transform group-hover/btn:translate-x-0.5" />}>
                  Explore the marketplace
                </ButtonLink>
              </Magnetic>
              <Magnetic strength={0.18}>
                <ButtonLink href="/register" variant="glass" size="xl" icon={<Wallet className="size-4" />}>
                  Open a storefront
                </ButtonLink>
              </Magnetic>
            </div>
          </Reveal>

          <Reveal delay={0.24}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[12.5px] text-mist-500">
              <span className="flex items-center gap-1.5">
                <Zap className="size-3.5 text-mint" />
                8% flat fee, no subscriptions
              </span>
              <span className="hidden size-1 rounded-full bg-white/14 sm:block" />
              <span>Payouts in USDC, USDT, DAI, ETH or memecoins</span>
              <span className="hidden size-1 rounded-full bg-white/14 sm:block" />
              <span>Instant buyer access &amp; lifetime updates</span>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.3}>
          <dl className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/8 bg-white/6 backdrop-blur-xl sm:grid-cols-4">
            {[
              { label: "Live projects", value: stats.projects },
              { label: "Verified creators", value: stats.creators },
              { label: "Transactions", value: stats.sales },
              { label: "Volume settled", value: stats.volumeCents / 100, prefix: "$", compact: true },
            ].map((item) => (
              <div key={item.label} className="group relative bg-ink-950/70 px-5 py-6 text-center transition-colors hover:bg-ink-900/70">
                <span className="pointer-events-none absolute inset-x-0 top-0 h-px scale-x-0 bg-linear-to-r from-transparent via-neon-400 to-transparent transition-transform duration-500 group-hover:scale-x-100" />
                <dd className="tnum font-display text-2xl font-semibold text-mist-50 sm:text-3xl">
                  <CountUp to={item.value} prefix={item.prefix ?? ""} compact={item.compact ?? false} />
                </dd>
                <dt className="mt-1 text-[11.5px] uppercase tracking-[0.12em] text-mist-500">{item.label}</dt>
              </div>
            ))}
          </dl>
</Reveal>
      </Container>
    </section>
  );
}