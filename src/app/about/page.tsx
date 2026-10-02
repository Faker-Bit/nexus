import type { Metadata } from "next";
import { Container, SectionHeading } from "@/components/ui/section";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/ui/motion";
import { SceneZone } from "@/components/three/webgl-zone";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "About NEXUS",
  description: "Why NEXUS exists, how trust works here, and how licensing is handled.",
};

export default function AboutPage() {
  return (
    <Container className="relative isolate pb-24">
      <SceneZone
        scene="aurora"
        settings={{ distance: 14, fov: 50, bloom: 0.55 }}
        tone="jade"
        margin="220px 0px"
        className="pointer-events-none absolute inset-x-[-8rem] -top-24 -z-10 h-[520px] opacity-70"
      />
      <SectionHeading
        eyebrow="About"
        title={
          <>
            Built for the people who <span className="text-gradient">actually ship.</span>
          </>
        }
        description="NEXUS exists because good software deserves a better distribution channel than a marketplace full of recycled templates and unverifiable sellers."
      />

      <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <Reveal className="space-y-6 text-[14.5px] leading-relaxed text-mist-300">
          <p>
            Most marketplaces for code optimise for volume: cheap listings, vague descriptions, and buyers who find
            out the archive is empty after paying. NEXUS optimises for delivery. Every listing carries real sales
            counts, verified purchase reviews and a live changelog - and a listing that stops matching its
            description gets flagged rather than buried.
          </p>
          <p>
            We took the parts that work from the places developers already trust - the code review culture of
            forges, the curation of product launches, the settlement guarantees of payment processors - and put
            them in one place with a Web3-native checkout.
          </p>
          <p>
            Settlement is intentionally boring: an 8% platform fee, a fixed set of stablecoins and networks, and
            payouts that land the moment a transfer confirms. No subscriptions, no listing fees, no paid
            &ldquo;featured&rdquo; slots that quietly rank above everyone else.
          </p>

          <h2 id="safety" className="pt-4 text-xl font-semibold">Trust &amp; safety</h2>
          <p>
            Verified badges require identity confirmation plus a manual review of the first listings. Downloads are
            signed, counted and logged against the buyer&apos;s licence, so hotlinking is traceable. Disputes are
            reviewed by a person within three business days, and the 30-day refund window is written into the terms
            rather than promised in a tooltip.
          </p>

          <h2 id="licensing" className="pt-4 text-xl font-semibold">Licensing</h2>
          <p>
            Creators pick a licence per listing. Buyers can upgrade to extended or resale rights at checkout, and
            every order records exactly which tier was granted - so support questions never depend on memory. NEXUS
            does not relicense your work and does not claim any rights over what you upload.
          </p>

          <div className="flex flex-wrap gap-2 pt-2">
            <Badge tone="neon">8% flat fee</Badge>
            <Badge tone="glass">No listing fees</Badge>
            <Badge tone="glass">Settlement on 4 networks</Badge>
            <Badge tone="glass">30-day refund window</Badge>
          </div>
        </Reveal>

        <aside className="space-y-4">
          <Reveal className="glass rounded-2xl p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-mist-500">Principles</p>
            <ul className="mt-4 space-y-4">
              {[
                { title: "Honest metadata", body: "If a listing is vague, it will not sell. We do not write marketing copy for you." },
                { title: "Custody-light payments", body: "Funds move buyer → creator. We never become the party holding your money." },
                { title: "Legible interfaces", body: "Checkout, fees and refunds are stated in plain numbers before the buyer commits." },
                { title: "Own your audience", body: "Export your buyers. Leave whenever you like. We would rather be useful than sticky." },
              ].map((item) => (
                <li key={item.title}>
                  <p className="text-[13.5px] font-medium text-mist-50">{item.title}</p>
                  <p className="mt-0.5 text-[12.5px] leading-relaxed text-mist-400">{item.body}</p>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={0.08} className="glass rounded-2xl p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-mist-500">Start here</p>
            <div className="mt-4 flex flex-col gap-2">
              <ButtonLink href="/explore" variant="secondary" full>
                Browse the marketplace
              </ButtonLink>
              <ButtonLink href="/register" full>
                Open a storefront
              </ButtonLink>
            </div>
          </Reveal>
        </aside>
      </div>
    </Container>
  );
}