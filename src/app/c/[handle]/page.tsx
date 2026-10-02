import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Award, CalendarDays, ExternalLink, MapPin, AtSign, MessageCircle, Sparkles, Users } from "lucide-react";
import { prisma } from "@/lib/db";
import { getCreatorByHandle, getCreatorProjects, getCreatorReviews, toCardData } from "@/lib/queries";
import { Container } from "@/components/ui/section";
import { Badge, VerifiedMark } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Stars } from "@/components/ui/rating";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/ui/motion";
import { ProjectCard } from "@/components/project/project-card";
import { FollowButton } from "@/components/creator/follow-button";
import { SceneZone } from "@/components/three/webgl-zone";
import { RevealText } from "@/components/ui/effects";
import { formatCompact, formatDate, formatUSD } from "@/lib/utils";

export const revalidate = 60;

type Params = Promise<{ handle: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { handle } = await params;
  const creator = await getCreatorByHandle(handle);
  if (!creator) return { title: "Creator not found" };
  return {
    title: `${creator.displayName} (@${creator.handle})`,
    description: creator.bio ?? `Shop projects by ${creator.displayName} on NEXUS.`,
  };
}

export default async function CreatorPage({ params }: { params: Params }) {
  const { handle } = await params;
  const creator = await getCreatorByHandle(handle);
  if (!creator) notFound();

  const [projects, reviews, aggregate, topTags] = await Promise.all([
    getCreatorProjects(handle, "trending"),
    getCreatorReviews(handle, 6),
    prisma.project.aggregate({
      where: { creatorId: creator.id, status: "published" },
      _sum: { saleCount: true, viewCount: true },
      _count: { _all: true },
    }),
    prisma.tag.groupBy({
      by: ["name"],
      where: { project: { creatorId: creator.id } },
      _count: { _all: true },
      orderBy: { _count: { name: "desc" } },
      take: 8,
    }),
  ]);

  const cover = creator.coverUrl;

  return (
    <Container className="pb-24">
      {/* cover */}
      <div className="relative isolate mt-6 h-40 overflow-hidden rounded-2xl border border-white/8 sm:h-56">
        {cover ? (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${cover})` }}
            role="img"
            aria-label={`${creator.displayName} cover`}
          />
        ) : (
          <>
            <SceneZone scene="galaxy" settings={{ distance: 13, fov: 48, bloom: 0.6, count: 1800 }} tone="jade" className="absolute inset-0" />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(90% 120% at 15% 10%, rgba(0,255,157,0.22), transparent 62%), radial-gradient(70% 90% at 85% 80%, rgba(16,224,160,0.2), transparent 62%)",
              }}
            />
            <div className="dot-surface absolute inset-0 opacity-50" />
          </>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-void/85 via-transparent to-transparent" />
      </div>

      {/* identity */}
      <div className="relative -mt-14 flex flex-col gap-5 px-4 sm:-mt-16 sm:px-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <Avatar name={creator.displayName} src={creator.avatarUrl} verified={creator.verified} size="2xl" className="rounded-full ring-4 ring-void" />
            <div className="min-w-0 pb-1">
                <h1 className="flex items-center gap-2 text-[clamp(1.5rem,3.6vw,2.2rem)] font-semibold leading-tight">
                <RevealText>{creator.displayName}</RevealText>
                {creator.verified ? <VerifiedMark /> : null}
              </h1>
              <p className="text-[13px] text-mist-500">@{creator.handle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 pb-1">
            <FollowButton
              handle={creator.handle}
              initialFollowing={false}
              followerCount={creator._count.followers}
            />
            {creator.website ? (
              <ButtonLink href={creator.website} variant="secondary" size="sm" icon={<ExternalLink className="size-3.5" />}>
                Website
              </ButtonLink>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[12.5px] text-mist-500">
          {creator.location ? (
            <span className="flex items-center gap-1.5">
              <MapPin className="size-3.5" />
              {creator.location}
            </span>
          ) : null}
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-3.5" />
            On NEXUS since {formatDate(creator.createdAt)}
          </span>
          {creator.github ? (
            <Link href={`https://github.com/${creator.github}`} className="flex items-center gap-1.5 transition-colors hover:text-mist-200">
              <GitHubMark />
              {creator.github}
            </Link>
          ) : null}
          {creator.twitter ? (
            <Link href={`https://x.com/${creator.twitter}`} className="flex items-center gap-1.5 transition-colors hover:text-mist-200">
              <AtSign className="size-3.5" />
              {creator.twitter}
            </Link>
          ) : null}
        </div>

        {creator.bio ? <p className="max-w-3xl text-[14.5px] leading-relaxed text-mist-300">{creator.bio}</p> : null}

        <dl className="mt-2 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/8 bg-white/6 sm:grid-cols-5">
          {[
            { label: "Reputation", value: String(creator.reputation), icon: Award },
            { label: "Projects", value: String(aggregate._count._all), icon: Sparkles },
            { label: "Sales", value: formatCompact(creator.totalSales), icon: MessageCircle },
            { label: "Earned", value: formatUSD(creator.totalEarningsCents), icon: Users },
            { label: "Rating", value: creator.ratingAvg > 0 ? creator.ratingAvg.toFixed(1) : "New", icon: Award },
          ].map((item) => (
            <div key={item.label} className="bg-ink-950/70 px-4 py-4 text-center">
              <dd className="tnum flex items-center justify-center gap-1.5 text-[19px] font-semibold text-mist-50">
                <item.icon className="size-3.5 text-neon-300" />
                {item.value}
              </dd>
              <dt className="mt-0.5 text-[10.5px] uppercase tracking-wider text-mist-500">{item.label}</dt>
            </div>
          ))}
        </dl>
      </div>

      {/* projects */}
      <section className="cv-auto mt-14">
        <Reveal>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Projects</h2>
              <p className="mt-1 text-[13px] text-mist-400">
                {projects.length} listing{projects.length === 1 ? "" : "s"} ·{" "}
                <span className="tnum">{formatCompact(aggregate._sum.saleCount ?? 0)}</span> total sales
              </p>
            </div>
            <div className="flex gap-2">
              <ButtonLink href={`/explore?q=${creator.handle}`} variant="outline" size="sm">
                Find more like these
              </ButtonLink>
            </div>
          </div>
        </Reveal>

        {projects.length ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {projects.map((project, i) => (
              <ProjectCard key={project.id} project={toCardData(project)} index={i} />
            ))}
          </div>
        ) : (
          <div className="glass rounded-2xl px-6 py-16 text-center">
            <p className="text-[15px] font-medium">Nothing published yet</p>
            <p className="mt-1 text-[13px] text-mist-400">This creator is still preparing their storefront.</p>
          </div>
        )}
      </section>

      <div className="mt-14 grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* reviews from this buyer */}
        <section>
          <h2 className="mb-5 text-xl font-semibold">Reviews written</h2>
          {reviews.length ? (
            <div className="space-y-3">
              {reviews.map((review) => (
                <article key={review.id} className="glass rounded-2xl p-5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <Stars value={review.rating} size="xs" />
                    {review.title ? <span className="text-[13.5px] font-medium text-mist-50">{review.title}</span> : null}
                    <Link
                      href={`/p/${review.project.slug}`}
                      className="text-[12px] text-mist-500 transition-colors hover:text-neon-200"
                    >
                      on {review.project.title}
                    </Link>
                  </div>
                  <p className="mt-2.5 text-[13.5px] leading-relaxed text-mist-300">{review.body}</p>
                </article>
              ))}
            </div>
          ) : (
            <p className="text-[13.5px] text-mist-400">This creator has not written any reviews yet.</p>
          )}
        </section>

        <aside className="space-y-5">
          {topTags.length ? (
            <div className="glass rounded-2xl p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-mist-500">Known for</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {topTags.map((tag) => (
                  <Link
                    key={tag.name}
                    href={`/explore?tags=${tag.name}`}
                    className="rounded-lg border border-white/8 bg-white/4 px-2 py-1 text-[11.5px] text-mist-300 transition-colors hover:border-neon-400/40 hover:text-neon-200"
                  >
                    {tag.name}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          <div className="glass rounded-2xl p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-mist-500">Reputation</p>
            <div className="mt-3 flex items-center gap-4">
              <div className="relative grid size-16 shrink-0 place-items-center">
                <svg viewBox="0 0 36 36" className="size-16 -rotate-90">
                  <path
                    d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831 15.9155 15.9155 0 0 1 0-31.831"
                    fill="none"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831 15.9155 15.9155 0 0 1 0-31.831"
                    fill="none"
                    stroke="url(#rep)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${Math.min(creator.reputation, 100)}, 100`}
                  />
                  <defs>
                    <linearGradient id="rep" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#00ff9d" />
                      <stop offset="100%" stopColor="#10e0a0" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="tnum absolute text-[15px] font-semibold text-mist-50">{creator.reputation}</span>
              </div>
              <div className="min-w-0">
                <Stars value={creator.ratingAvg} size="sm" showValue />
                <p className="mt-1 text-[11.5px] leading-relaxed text-mist-500">
                  Earned from delivered sales, five-star reviews and dispute-free history.
                </p>
              </div>
            </div>
          </div>

          {creator.reputation >= 80 ? (
            <Badge tone="mint" className="w-full justify-center py-2">
              Trusted creator - files match descriptions
            </Badge>
          ) : null}
        </aside>
      </div>
    </Container>
  );
}

function GitHubMark() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-3.5">
      <path d="M12 .5C5.73.5.5 5.73.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.55v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.71.08-.71 1.17.08 1.79 1.2 1.79 1.2 1.04 1.79 2.73 1.27 3.4.97.1-.76.41-1.28.74-1.57-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.3 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.8 1.18 1.84 1.18 3.1 0 4.43-2.69 5.4-5.25 5.69.42.36.79 1.07.79 2.16v3.2c0 .3.21.66.8.55A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
    </svg>
  );
}
