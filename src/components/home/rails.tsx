"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Flame, Sparkles } from "lucide-react";
import { ProjectCard } from "@/components/project/project-card";
import { Container, SectionHeading } from "@/components/ui/section";
import { ButtonLink } from "@/components/ui/button";
import { cn, formatUSD } from "@/lib/utils";
import type { CardData } from "@/lib/queries";

/** Horizontally scrolling rail with arrow controls and edge masks. */
export function ProjectRail({
  items,
  eyebrow,
  title,
  description,
  href,
  hrefLabel = "View all",
  rank = false,
}: {
  items: CardData[];
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  href?: string;
  hrefLabel?: string;
  rank?: boolean;
}) {
  const scroller = useRef<HTMLDivElement>(null);

  const scrollBy = (direction: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: direction * Math.min(el.clientWidth * 0.82, 720), behavior: "smooth" });
  };

  if (!items.length) return null;

  return (
    <section className="cv-auto relative py-14 sm:py-16">
      <Container>
        <SectionHeading
          eyebrow={eyebrow}
          title={title}
          description={description}
          action={
            <div className="flex items-center gap-2">
              <button
                onClick={() => scrollBy(-1)}
                aria-label="Scroll left"
                className="glass hidden size-10 place-items-center rounded-xl text-mist-300 transition-all hover:border-white/20 hover:text-mist-50 sm:grid"
              >
                <ArrowLeft className="size-4" />
              </button>
              <button
                onClick={() => scrollBy(1)}
                aria-label="Scroll right"
                className="glass hidden size-10 place-items-center rounded-xl text-mist-300 transition-all hover:border-white/20 hover:text-mist-50 sm:grid"
              >
                <ArrowRight className="size-4" />
              </button>
              {href ? (
                <ButtonLink href={href} variant="outline" size="sm" iconRight={<ArrowRight className="size-3.5" />}>
                  {hrefLabel}
                </ButtonLink>
              ) : null}
            </div>
          }
        />
      </Container>

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-linear-to-r from-void to-transparent sm:w-16" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-linear-to-l from-void to-transparent sm:w-16" />
        <div
          ref={scroller}
          className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-4 pb-4 sm:px-6 lg:px-8"
          style={{ scrollbarWidth: "none" }}
        >
          {items.map((project, i) => (
            <ProjectCard
              key={project.id}
              project={project}
              index={i}
              rank={rank ? i + 1 : undefined}
              priority={i < 2}
              className="w-[82vw] shrink-0 snap-start sm:w-[46vw] lg:w-[31vw] xl:w-[25.5vw]"
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export function TrendingRail({ items }: { items: CardData[] }) {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_80%_at_20%_0%,rgba(139,92,246,0.1),transparent_70%)]" />
      <ProjectRail
        items={items}
        eyebrow={
          <>
            <Flame className="size-3" /> Live
          </>
        }
        title="Trending this week"
        description="Ranked by velocity - views, saves, sales and review velocity blended into one score."
        href="/explore?sort=trending"
        rank
      />
    </div>
  );
}

export function FeaturedGrid({ items }: { items: CardData[] }) {
  if (!items.length) return null;
  return (
    <section className="cv-auto py-14 sm:py-16">
      <Container>
        <SectionHeading
          eyebrow={
            <>
              <Sparkles className="size-3" /> Curated
            </>
          }
          title="Featured creations"
          description="Hand-picked listings from creators we have reviewed - quality over quantity."
          action={
            <ButtonLink href="/explore?featured=1" variant="outline" size="sm" iconRight={<ArrowRight className="size-3.5" />}>
              Browse featured
            </ButtonLink>
          }
        />
        <div className="cv-cards grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((project, i) => (
            <ProjectCard key={project.id} project={project} index={i} priority={i < 3} />
          ))}
        </div>
      </Container>
    </section>
  );
}

export function CategoryTiles({
  categories,
}: {
  categories: Array<{ key: string; label: string; count: number; sales: number; hue: string; icon: string }>;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {categories.map((cat, i) => (
        <motion.div
          key={cat.key}
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.55, delay: Math.min(i * 0.06, 0.35), ease: [0.16, 1, 0.3, 1] }}
        >
          <Link
            href={`/explore?category=${cat.key}&sort=best-selling`}
            className="neon-ring group relative block h-full overflow-hidden rounded-2xl border border-white/7 bg-white/[0.025] p-5 transition-all duration-300 hover:-translate-y-1.5 hover:border-white/16"
            style={{ "--ring-color": cat.hue, "--ring-color-2": cat.hue } as React.CSSProperties}
          >
            <div
              className="pointer-events-none absolute -right-8 -top-10 size-32 rounded-full opacity-40 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:opacity-70"
              style={{ background: cat.hue }}
            />
            <div className="relative">
              <span
                className="inline-grid size-9 place-items-center rounded-xl text-[13px] font-bold transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                style={{ background: `${cat.hue}1f`, color: cat.hue, boxShadow: `inset 0 0 0 1px ${cat.hue}44` }}
              >
                {cat.label.slice(0, 2).toUpperCase()}
              </span>
              <h3 className="mt-4 text-[15px] font-semibold text-mist-50">{cat.label}</h3>
              <p className="mt-1 text-[12px] text-mist-500">
                <span className="tnum text-mist-300">{cat.count}</span> projects ·{" "}
                <span className="tnum">{cat.sales}</span> sales
              </p>
              <span
                className="mt-4 inline-flex items-center gap-1 text-[12px] font-medium transition-transform duration-300 group-hover:translate-x-1"
                style={{ color: cat.hue }}
              >
                Explore
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}

export function PriceTag({ cents, currency }: { cents: number; currency: string }) {
  return (
    <span className={cn("tnum font-display font-semibold")}>
      {formatUSD(cents)} {cents > 0 ? currency : ""}
    </span>
  );
}