import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  Check,
  Coins,
  Percent,
  ShieldCheck,
  Wallet,
  Zap,
} from "lucide-react";
import { Container, SectionHeading } from "@/components/ui/section";
import { FeeCalculator } from "@/components/pricing/fee-calculator";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Reveal, CountUp } from "@/components/ui/motion";
import { RevealText } from "@/components/ui/effects";
import { SceneZone } from "@/components/three/webgl-zone";
import { FAQ, FEE_LABEL } from "@/components/pricing/faq";

export const metadata: Metadata = {
  title: "Pricing & payouts",
  description: "8% flat fee, no subscriptions, no listing costs. See exactly what a creator keeps and how payouts settle.",
};

export default function PricingPage() {
  return (
    <>
      <section className="cv-auto relative isolate overflow-hidden py-20">
        <SceneZone scene="coin" settings={{ distance: 9, fov: 44, bloom: 0.85, position: [2.6, 0.4, 0] }}
          
          tone="emerald"
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[620px]"
                  />
        <Container>
          <div className="flex flex-col items-center text-center">
            <Reveal>
              <Badge tone="neon" className="mb-6">
                Transparent by default
              </Badge>
              <h1 className="max-w-3xl text-[clamp(2.2rem,6vw,4rem)] font-semibold leading-[1.02]">
                <RevealText>One fee.</RevealText>{" "}
                <RevealText delay={0.2} className="text-gradient">
                  Eight percent.
                </RevealText>
              </h1>
              <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-mist-300">
                Listing is free. You only pay when a buyer checks out - and payouts land in your wallet within
                seconds of settlement, with no withdrawal threshold.
              </p>
            </Reveal>
          </div>

          <div className="mx-auto mt-14 grid max-w-5xl gap-5 md:grid-cols-3">
            <Reveal className="glass relative overflow-hidden rounded-2xl p-6">
              <span className="grid size-10 place-items-center rounded-xl bg-neon-400/14 text-neon-300">
                <Percent className="size-5" />
              </span>
              <p className="tnum mt-5 font-display text-4xl font-semibold">8%</p>
              <p className="mt-1 text-[13px] text-mist-400">Flat platform fee on every sale</p>
              <ul className="mt-5 space-y-2 text-[12.5px] text-mist-400">
                {["No listing fees", "No monthly subscription", "No pay-to-feature tiers"].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Check className="size-3.5 text-mint" />
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={0.06} className="glass relative overflow-hidden rounded-2xl p-6">
              <span className="grid size-10 place-items-center rounded-xl bg-violet-neon/16 text-violet-soft">
                <Wallet className="size-5" />
              </span>
              <p className="tnum mt-5 font-display text-4xl font-semibold">$0</p>
              <p className="mt-1 text-[13px] text-mist-400">Minimum payout, ever</p>
              <ul className="mt-5 space-y-2 text-[12.5px] text-mist-400">
                {["USDC, USDT, DAI, ETH", "Ethereum, Base, Arbitrum, Polygon", "Memecoin rails on request"].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Check className="size-3.5 text-mint" />
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={0.12} className="glass relative overflow-hidden rounded-2xl p-6">
              <span className="grid size-10 place-items-center rounded-xl bg-mint/14 text-mint">
                <Zap className="size-5" />
              </span>
              <p className="tnum mt-5 font-display text-4xl font-semibold">
                <CountUp to={30} suffix="s" />
              </p>
              <p className="mt-1 text-[13px] text-mist-400">Checkout window on an accepted offer</p>
              <ul className="mt-5 space-y-2 text-[12.5px] text-mist-400">
                {["Instant access after settlement", "Signed download receipts", "Lifetime buyer updates"].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Check className="size-3.5 text-mint" />
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          {/* calculator */}
          <Reveal className="mx-auto mt-12 max-w-3xl">
            <FeeCalculator />
          </Reveal>
        </Container>
      </section>

      <section id="payouts" className="relative isolate overflow-hidden border-y border-white/6 bg-ink-950/40 py-20">
        <SceneZone scene="aurora" settings={{ distance: 13, fov: 50, bloom: 0.55, position: [-3, 0.5, 0] }}
          
          tone="jade"
          className="pointer-events-none absolute inset-0 -z-10 opacity-80"
                  />
        <Container>
          <SectionHeading
            eyebrow="Payouts"
            title="How the money moves"
            description="Four steps, no custody surprises. NEXUS never holds your funds for longer than one block."
            align="center"
          />
          <div className="grid gap-5 md:grid-cols-4">
            {[
              { icon: Wallet, title: "Buyer checks out", body: "They sign the payment in their wallet on the network of their choice." },
              { icon: ShieldCheck, title: "Settlement confirms", body: "We verify the transfer server-side before anything is delivered." },
              { icon: Coins, title: "Access unlocks", body: "A signed download link is minted against the buyer's licence." },
              { icon: Banknote, title: "You are paid", body: "Your share lands in your wallet. We only ever keep the 8%." },
            ].map((step, i) => (
              <Reveal key={step.title} delay={i * 0.06}>
                <div className="glass h-full rounded-2xl p-5">
                  <span className="grid size-9 place-items-center rounded-xl bg-white/6 text-neon-300">
                    <step.icon className="size-4" />
                  </span>
                  <p className="tnum mt-4 font-mono text-[10.5px] text-mist-600">0{i + 1}</p>
                  <h3 className="mt-1 text-[14px] font-medium text-mist-50">{step.title}</h3>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-mist-400">{step.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <section id="guide" className="cv-auto py-20">
        <Container>
          <SectionHeading eyebrow="Seller guide" title="Get your first sale" align="center" />
          <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-3">
            {[
              { title: "List it", body: "Five minutes in the wizard. Screenshots, demo, archive." },
              { title: "Price it", body: "Free, fixed, or open to offers. Data from similar listings helps." },
              { title: "Ship updates", body: "Free updates drive repeat sales and better search rank." },
            ].map((item, i) => (
              <Reveal key={item.title} delay={i * 0.06}>
                <div className="glass h-full rounded-2xl p-5">
                  <h3 className="text-[15px] font-semibold">{item.title}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-mist-400">{item.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="mt-10 flex flex-col items-center gap-3">
            <ButtonLink href="/register" size="xl" iconRight={<ArrowRight className="size-4" />}>
              Open your storefront - free
            </ButtonLink>
            <Link href="/explore" className="text-[12.5px] text-mist-500 transition-colors hover:text-mist-200">
              Or browse what sellers are charging
            </Link>
          </div>
        </Container>
      </section>

      <section className="cv-auto pb-24">
        <Container>
          <SectionHeading eyebrow="FAQ" title="Questions, answered" align="center" />
          <div className="mx-auto max-w-3xl space-y-3">
            {FAQ.map((item, i) => (
              <Reveal key={item.q} delay={i * 0.04}>
                <details className="glass group rounded-2xl p-5 [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer items-center justify-between gap-4 text-[14px] font-medium text-mist-50">
                    {item.q}
                    <span className="text-mist-500 transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 text-[13px] leading-relaxed text-mist-400">{item.a}</p>
                </details>
              </Reveal>
            ))}
          </div>
          <p className="mt-8 text-center text-[12px] text-mist-600">
            Current fee configuration: {FEE_LABEL}. Charged on the gross sale price.
          </p>
        </Container>
      </section>
    </>
  );
}
