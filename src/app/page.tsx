import type { Metadata } from "next";
import { ArrowRight, Sparkles } from "lucide-react";
import { getLandingData, toCardData } from "@/lib/queries";
import { Hero } from "@/components/home/hero";
import { TickerStrip } from "@/components/home/ticker-strip";
import { CategoryTiles, FeaturedGrid, ProjectRail, TrendingRail } from "@/components/home/rails";
import { CreatorShowcase } from "@/components/home/creator-showcase";
import { FinalCta, HowItWorks, TrustGrid, ValueGrid } from "@/components/home/how-it-works";
import { Container, SectionHeading } from "@/components/ui/section";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/ui/motion";
import { Parallax, RevealText } from "@/components/ui/effects";
import { SceneZone } from "@/components/three/webgl-zone";
import { formatUSD } from "@/lib/utils";

export const metadata: Metadata = {
  title: "NEXUS - The marketplace where builders get paid",
  description:
    "Discover and sell code, apps, bots, AI agents, scripts and datasets. Verified creators, real reviews, on-chain settlement in stablecoins or memecoins.",
};

export const revalidate = 60;

export default async function LandingPage() {
  const data = await getLandingData();

  /*
   * Card props are serialised into the RSC payload, so the same project must not
   * be shipped twice. Featured is a subset of trending and the creator spotlight
   * is a subset of newest, so they are sliced from arrays we already have.
   */
  const trending = data.trending.map(toCardData);
  const newest = data.newest.map(toCardData);
  const featuredSlugs = new Set(data.featured.map((p) => p.slug));
  const featured = trending.filter((p) => featuredSlugs.has(p.slug));

  // The ticker only needs five short strings per item.
  const tickerItems = trending.slice(0, 14).map((p) => ({
    slug: p.slug,
    title: p.title,
    price: p.priceCents === 0 ? "Free" : formatUSD(p.priceCents),
    hue: p.hue,
    creator: p.creator.handle,
  }));

  return (
    <>
      <Hero stats={data.stats} />
      <TickerStrip items={tickerItems} />

      <TrendingRail items={trending} />
      {featured.length ? <FeaturedGrid items={featured} /> : null}

      <section className="cv-auto relative isolate overflow-hidden py-16 sm:py-20">
        <SceneZone scene="wave" settings={{ distance: 11, fov: 50, bloom: 0.7 }} tone="emerald" className="pointer-events-none absolute inset-0 -z-10 opacity-80" />
        <Container>
          <SectionHeading
            eyebrow="Browse by craft"
            title={
              <RevealText>Whatever you build, there is a shelf for it</RevealText>
            }
            description="From a single shell script to a full agent runtime — categories are designed around how people actually ship."
            action={
              <ButtonLink href="/explore" variant="outline" size="sm" iconRight={<ArrowRight className="size-3.5" />}>
                All categories
              </ButtonLink>
            }
          />
          <CategoryTiles categories={data.categories} />
        </Container>
      </section>

      <HowItWorks />

      <section className="py-14">
        <Container>
          <ValueGrid />
        </Container>
      </section>

      <Parallax distance={40} className="relative">
        <CreatorShowcase creators={data.topCreators} showcase={newest.slice(0, 8).map((p) => ({
                    slug: p.slug,
                    title: p.title,
                    priceCents: p.priceCents,
                    hue: p.hue,
                    creator: p.creator.handle,
                  }))} />
      </Parallax>

      <TrustGrid />

      <section className="cv-auto py-16">
        <Container>
          <SectionHeading
            eyebrow={
              <>
                <Sparkles className="size-3" /> Fresh
              </>
            }
            title="Just listed"
            description="Newest additions from the community. Be the first to grab one."
            action={
              <ButtonLink href="/explore?sort=newest" variant="outline" size="sm" iconRight={<ArrowRight className="size-3.5" />}>
                See everything new
              </ButtonLink>
            }
          />
          <ProjectRail items={newest.slice(0, 12)} title="" href={undefined} />
        </Container>
      </section>

      <section className="cv-auto pb-4">
        <Container>
          <Reveal>
            <div className="glass flex flex-col items-center gap-4 rounded-2xl px-6 py-8 text-center sm:flex-row sm:justify-between sm:text-left">
              <div>
                <h3 className="text-lg font-semibold">Looking for something specific?</h3>
                <p className="mt-1 text-[13.5px] text-mist-400">
                  Post a request and let creators come to you - with offers, not cold DMs.
                </p>
              </div>
              <ButtonLink href="/explore" variant="secondary" iconRight={<ArrowRight className="size-4" />}>
                Browse requests
              </ButtonLink>
            </div>
          </Reveal>
        </Container>
      </section>

      <FinalCta />
    </>
  );
}