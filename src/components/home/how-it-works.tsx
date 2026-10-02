"use client";

import {
  ArrowRight,
  BadgeCheck,
  Coins,
  FileCode2,
  HandCoins,
  Layers,
  Repeat,
  ShieldCheck,
  UploadCloud,
  Wallet,
  Zap,
} from "lucide-react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import { Container, SectionHeading } from "@/components/ui/section";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Magnetic, Reveal } from "@/components/ui/motion";
import { SceneZone } from "@/components/three/webgl-zone";
import { cn } from "@/lib/utils";

const BUYER_STEPS = [
  {
    icon: Layers,
    title: "Explore with signal",
    body: "Filter by category, stack, license and price. Every listing shows real sales, verified reviews and code health - not vanity downloads.",
  },
  {
    icon: Wallet,
    title: "Pay however you like",
    body: "Stablecoins, majors or the occasional memecoin rail. Your wallet signs the payment; NEXUS verifies it and unlocks access instantly.",
  },
  {
    icon: FileCode2,
    title: "Own the work",
    body: "Download source and assets the moment settlement confirms. Lifetime updates, a license key and a receipt in your transaction history.",
  },
];

const SELLER_STEPS = [
  {
    icon: UploadCloud,
    title: "List in minutes",
    body: "Screenshots, demo video, docs, GitHub link and the actual archive. A structured wizard keeps metadata consistent and discoverable.",
  },
  {
    icon: HandCoins,
    title: "Set price or take offers",
    body: "List a fixed price, or let buyers negotiate. You choose the floor; offers convert to a live checkout with one tap.",
  },
  {
    icon: Coins,
    title: "Get paid on-chain",
    body: "8% flat fee. No monthly subscription, no payout minimum games. Withdraw to USDC, USDT, DAI, ETH - or a memecoin if that is the vibe.",
  },
];

function StepList({ steps, tone }: { steps: typeof BUYER_STEPS; tone: "neon" | "violet" }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <div ref={ref} className="space-y-4">
      {steps.map((step, i) => (
        <motion.div
          key={step.title}
          initial={reduce ? false : { opacity: 0, x: tone === "neon" ? -20 : 20 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.55, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
          style={{ transform: "translateZ(0)" }}
          className="group relative flex gap-4 rounded-2xl border border-white/7 bg-white/[0.022] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-neon-400/28 hover:bg-white/5 hover:shadow-[0_28px_60px_-32px_rgba(0,255,157,0.35)]"
        >
          <span
            className={cn(
              "grid size-10 shrink-0 place-items-center rounded-xl border transition-all duration-300 group-hover:scale-105",
              tone === "neon"
                ? "border-neon-400/28 bg-neon-400/10 text-neon-300"
                : "border-violet-neon/30 bg-violet-neon/12 text-violet-soft",
            )}
          >
            <step.icon className="size-4.5" />
          </span>
          <div>
            <h3 className="text-[15px] font-semibold text-mist-50">
              <span className="mr-2 font-mono text-[11px] text-mist-600">0{i + 1}</span>
              {step.title}
            </h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-mist-400">{step.body}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export function HowItWorks() {
  return (
    <section id="how-it-works" className="cv-auto relative py-20 sm:py-24">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />
      <Container>
        <SectionHeading
          eyebrow="How NEXUS works"
          align="center"
          title={
            <>
              Two rails. <span className="text-gradient">One marketplace.</span>
            </>
          }
          description="Buyers get working software with a paper trail. Creators get paid without giving up their margin or their audience."
        />

        <div className="mt-14 grid gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <div className="mb-6 flex items-center gap-3">
              <Badge tone="neon">For buyers</Badge>
              <span className="h-px flex-1 bg-linear-to-r from-neon-400/30 to-transparent" />
            </div>
            <StepList steps={BUYER_STEPS} tone="neon" />
            <Magnetic strength={0.16} className="mt-5 inline-block">
              <ButtonLink href="/explore" variant="outline" iconRight={<ArrowRight className="size-4" />}>
                Start browsing
              </ButtonLink>
            </Magnetic>
          </div>

          <div>
            <div className="mb-6 flex items-center gap-3">
              <Badge tone="violet">For creators</Badge>
              <span className="h-px flex-1 bg-linear-to-r from-violet-neon/30 to-transparent" />
            </div>
            <StepList steps={SELLER_STEPS} tone="violet" />
            <Magnetic strength={0.16} className="mt-5 inline-block">
              <ButtonLink href="/register" variant="outline" iconRight={<ArrowRight className="size-4" />}>
                Open your storefront
              </ButtonLink>
            </Magnetic>
          </div>
        </div>
      </Container>
    </section>
  );
}

const TRUST = [
  {
    icon: BadgeCheck,
    title: "Verified creators",
    body: "Identity checks plus a manual review before a creator badge is granted. Fake accounts get removed.",
  },
  {
    icon: ShieldCheck,
    title: "Escrowed delivery",
    body: "Funds settle before access tokens are minted. Downloads are signed, watermarked and revocable.",
  },
  {
    icon: Repeat,
    title: "Refunds on file loss",
    body: "If a delivered archive stops working, buyers can escalate within 30 days for a full refund.",
  },
  {
    icon: Zap,
    title: "No hidden cut",
    body: "One flat 8% fee. No listing fees, no subscription, no pay-to-feature upsells.",
  },
];

export function TrustGrid() {
  return (
    <section id="safety" className="border-y border-white/6 bg-ink-950/40 py-20">
      <Container>
        <SectionHeading
          eyebrow="Trust & safety"
          title="Built for work that has to keep working"
          description="Marketplaces live or die on trust. Here is the machinery behind it."
          align="center"
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST.map((item, i) => (
            <Reveal key={item.title} delay={i * 0.07}>
              <div className="group relative h-full overflow-hidden rounded-2xl border border-white/7 bg-white/[0.025] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-neon-400/24">
                <div className="pointer-events-none absolute inset-x-0 -top-16 h-32 bg-[radial-gradient(60%_100%_at_50%_100%,rgba(45,226,255,0.16),transparent_70%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <item.icon className="size-5 text-neon-300" />
                <h3 className="mt-4 text-[15px] font-semibold text-mist-50">{item.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-mist-400">{item.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="cv-auto relative isolate overflow-hidden py-24">
      <SceneZone
        scene="knots"
        settings={{ distance: 12, fov: 48, bloom: 0.7, position: [-2.4, 0, 0] }}
        tone="lime"
        margin="240px 0px"
        className="pointer-events-none absolute inset-0 -z-10 opacity-85"
      />
      <Container>
        <div className="glass-strong relative overflow-hidden rounded-3xl px-6 py-14 text-center sm:px-14">
          <div className="pointer-events-none absolute inset-x-0 -top-24 h-48 bg-[radial-gradient(50%_100%_at_50%_100%,rgba(0,255,157,0.2),transparent_70%)]" />
          <Reveal>
            <h2 className="mx-auto max-w-3xl text-[clamp(1.9rem,5vw,3.2rem)] font-semibold leading-[1.06]">
              Your next build already has buyers.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-[15.5px] leading-relaxed text-mist-300">
              Publish in an afternoon, price it your way, and get paid the moment someone says yes. No lock-in,
              no subscriptions, no audience required.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Magnetic strength={0.22}>
                <ButtonLink href="/register" size="xl" iconRight={<ArrowRight className="size-4" />}>
                  Create your storefront
                </ButtonLink>
              </Magnetic>
              <Magnetic strength={0.18}>
                <ButtonLink href="/pricing" variant="glass" size="xl">
                  See fees &amp; payouts
                </ButtonLink>
              </Magnetic>
            </div>
            <p className="mt-6 text-[12.5px] text-mist-500">
              Free to list · 8% only when you sell · Payout in USDC, USDT, DAI, ETH
            </p>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

export function ValueGrid() {
  const items = [
    { k: "8%", v: "flat platform fee" },
    { k: "$0", v: "to list a project" },
    { k: "30d", v: "money-back on file loss" },
    { k: "5", v: "settlement networks" },
  ];
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/8 bg-white/6 sm:grid-cols-4">
      {items.map((item) => (
        <div key={item.k} className="bg-ink-950/70 px-5 py-6 text-center">
          <p className="tnum font-display text-2xl font-semibold text-gradient">{item.k}</p>
          <p className="mt-1 text-[11.5px] uppercase tracking-[0.12em] text-mist-500">{item.v}</p>
        </div>
      ))}
    </div>
  );
}