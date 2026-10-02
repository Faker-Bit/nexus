import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Eye,
  ShoppingBag,
  TrendingUp,
  Zap,
} from "lucide-react";
import {
  getProjectBySlug,
  getProjectRatings,
  getProjectReviews,
  getRelatedProjects,
  toCardData,
} from "@/lib/queries";
import { prisma } from "@/lib/db";
import { trackView } from "@/lib/deferred";
import { loadUser } from "@/lib/auth";
import { Container } from "@/components/ui/section";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/ui/motion";
import { ButtonLink } from "@/components/ui/button";
import { Gallery } from "@/components/project/gallery";
import { BuyBox, CopyButton, FileSpec, LinkRow, TokenBadge } from "@/components/project/buy-box";
import { LikeButton } from "@/components/project/like-button";
import { ReviewSection } from "@/components/project/review-section";
import { ProjectDetailTabs } from "@/components/project/detail-tabs";
import { ProjectCard } from "@/components/project/project-card";
import { ProjectPreview } from "@/components/project/project-preview";
import { CreatorMiniCard } from "@/components/creator/creator-mini-card";
import { CATEGORY_MAP, LICENSE_MAP } from "@/lib/constants";
import { formatCompact, formatNumber, timeAgo } from "@/lib/utils";

export const revalidate = 30;

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return { title: "Project not found" };

  const description = project.tagline;
  return {
    title: project.title,
    description,
    openGraph: {
      title: project.title,
      description,
      type: "website",
      images: project.coverImage ? [project.coverImage] : undefined,
    },
    twitter: { card: "summary_large_image", title: project.title, description },
  };
}

export default async function ProjectPage({ params }: { params: Params }) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  const user = await loadUser();
  const [reviews, buckets, related] = await Promise.all([
    getProjectReviews(project.id, 12),
    getProjectRatings(project.id),
    getRelatedProjects(project, 4),
  ]);

  const [owned, reviewableOrder, liked] = await Promise.all([
    user
      ? prisma.order.findFirst({ where: { projectId: project.id, buyerId: user.id, status: "paid" }, select: { id: true } })
      : null,
    user
      ? prisma.order.findFirst({
          where: { projectId: project.id, buyerId: user.id, status: "paid", review: null },
          select: { id: true },
        })
      : null,
    user
      ? prisma.projectLike.findUnique({
          where: { userId_projectId: { userId: user.id, projectId: project.id } },
          select: { userId: true },
        })
      : null,
  ]);

// View tracking runs after the response is flushed, never in front of TTFB.
  trackView(project.id, user?.id ?? null, `/p/${project.slug}`);

  const category = CATEGORY_MAP[project.category] ?? { label: project.category, hue: "#00ff9d" };
  const hue = category.hue;

  return (
    <Container className="pb-24">
      {/* breadcrumb */}
      <nav className="flex items-center gap-2 py-5 text-[12px] text-mist-500" aria-label="Breadcrumb">
        <Link href="/explore" className="flex items-center gap-1 transition-colors hover:text-mist-200">
          <ArrowLeft className="size-3.5" />
          Explore
        </Link>
        <span>/</span>
        <Link href={`/explore?category=${project.category}`} className="transition-colors hover:text-mist-200">
          {category.label}
        </Link>
        <span>/</span>
        <span className="truncate text-mist-300">{project.title}</span>
      </nav>

      {/* title block */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
              style={{ background: `${hue}18`, color: hue }}
            >
              <span className="size-1.5 rounded-full" style={{ background: hue, boxShadow: `0 0 8px ${hue}` }} />
              {category.label}
            </span>
            {project.featured ? <Badge tone="violet">Featured</Badge> : null}
            {project.status !== "published" ? <Badge tone="amber">{project.status}</Badge> : null}
            {project.trendingScore > 60 ? (
              <Badge tone="neon">
                <TrendingUp className="size-3" />Trending
              </Badge>
            ) : null}
            <TokenBadge symbol={project.currency} />
            {project.acceptsMeme && project.memeToken ? (
              <Badge tone="meme">
                <Zap className="size-3" />
                {project.memeToken} accepted
              </Badge>
            ) : null}
          </div>

          <h1 className="mt-4 text-[clamp(1.9rem,4.6vw,3rem)] font-semibold leading-[1.06]">{project.title}</h1>
          <p className="mt-3 max-w-3xl text-[15.5px] leading-relaxed text-mist-300">{project.tagline}</p>

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2.5 text-[12.5px] text-mist-500">
            <span className="flex items-center gap-1.5">
              <ShoppingBag className="size-3.5 text-mist-400" />
              <span className="tnum">{formatNumber(project.saleCount)}</span> sales
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="size-3.5 text-mist-400" />
              <span className="tnum">{formatCompact(project.viewCount)}</span> views
            </span>
            <LikeButton projectId={project.id} initialLiked={Boolean(liked)} initialCount={project.likeCount} />
            {project.publishedAt ? (
              <span className="flex items-center gap-1.5">
                <Calendar className="size-3.5 text-mist-400" />
                Updated {timeAgo(project.updatedAt)}
              </span>
            ) : null}
          </div>
        </div>

        <div className="hidden shrink-0 lg:block">
          <CreatorMiniCard
            creator={{
              handle: project.creator.handle,
              displayName: project.creator.displayName,
              avatarUrl: project.creator.avatarUrl,
              verified: project.creator.verified,
            }}
          />
        </div>
      </div>

      {/* main grid */}
      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-8">
          <Gallery
            assets={project.assets.map((a) => ({ id: a.id, url: a.url, kind: a.kind, alt: a.alt }))}
            title={project.title}
            hue={hue}
            previewVideo={project.previewVideo}
          />

          <div className="hidden lg:block">
            <ProjectPreview seed={project.slug} hue={hue} className="aspect-[21/9]" />
          </div>

          <ProjectDetailTabs
            description={project.description}
            docsUrl={project.docsUrl}
            repoUrl={project.repoUrl}
            demoUrl={project.demoUrl}
            websiteUrl={project.websiteUrl}
            tags={project.tags.map((t) => t.name)}
            facts={[
              { icon: "category", label: "Category", value: category.label },
              { icon: "stack", label: "Stack", value: project.language ?? "Multi" },
              { icon: "license", label: "License", value: LICENSE_MAP[project.license] ?? project.license },
              { icon: "version", label: "Version", value: "1.4.2" },
              { icon: "updates", label: "Updates", value: "Lifetime" },
              { icon: "delivery", label: "Delivery", value: "Instant on settlement" },
            ]}
          />

          <section id="reviews">
            <h2 className="mb-5 text-xl font-semibold">Reviews</h2>
            <ReviewSection
              avg={project.ratingAvg}
              count={project.ratingCount}
              buckets={buckets}
              reviews={reviews.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }))}
              reviewableOrderId={reviewableOrder?.id ?? null}
              projectTitle={project.title}
            />
          </section>
        </div>

        {/* rail */}
        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <BuyBox
            project={{
              id: project.id,
              slug: project.slug,
              title: project.title,
              priceCents: project.priceCents,
              currency: project.currency,
              chain: project.chain,
              acceptsOffers: project.acceptsOffers,
              acceptsMeme: project.acceptsMeme,
              memeToken: project.memeToken,
              saleCount: project.saleCount,
              ratingCount: project.ratingCount,
              creator: { handle: project.creator.handle, displayName: project.creator.displayName },
            }}
            owned={Boolean(owned)}
          />

          <div className="glass rounded-2xl p-5">
            <h3 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-mist-500">What you get</h3>
            <div className="mt-3.5 space-y-3">
              {project.demoUrl ? (
                <LinkRow href={project.demoUrl} icon="globe" label="Live demo" sub={new URL(project.demoUrl).hostname} />
              ) : null}
              {project.repoUrl ? (
                <LinkRow href={project.repoUrl} icon="github" label="Source repository" sub="Git / GitHub" />
              ) : null}
              {project.docsUrl ? (
                <LinkRow href={project.docsUrl} icon="file" label="Documentation" sub="Guides & API reference" />
              ) : null}
              {project.websiteUrl ? <LinkRow href={project.websiteUrl} icon="globe" label="Product site" /> : null}
              {!project.demoUrl && !project.repoUrl && !project.docsUrl ? (
                <p className="text-[12.5px] text-mist-500">This creator did not link external resources.</p>
              ) : null}
            </div>

            <div className="mt-4 border-t border-white/8 pt-4">
              <FileSpec
                fileName={project.fileName}
                fileSizeBytes={project.fileSizeBytes}
                downloadCount={project.downloadCount}
                license={LICENSE_MAP[project.license] ?? project.license}
              />
            </div>

            {project.tags.length ? (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {project.tags.map((tag) => (
                  <Link
                    key={tag.id}
                    href={`/explore?tags=${tag.name}`}
                    className="rounded-md border border-white/8 bg-white/4 px-1.5 py-0.5 font-mono text-[10px] text-mist-400 transition-colors hover:border-neon-400/40 hover:text-neon-200"
                  >
                    {tag.name}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>

          <div className="lg:hidden">
            <CreatorMiniCard
              creator={{
                handle: project.creator.handle,
                displayName: project.creator.displayName,
                avatarUrl: project.creator.avatarUrl,
                verified: project.creator.verified,
              }}
              detailed
            />
          </div>

          <div className="glass rounded-2xl p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-mist-500">Listing id</p>
            <div className="mt-2 flex items-center justify-between gap-2">
              <code className="truncate font-mono text-[11.5px] text-mist-400">{project.id}</code>
              <CopyButton value={project.id} />
            </div>
          </div>
        </aside>
      </div>

      {related.length ? (
        <section className="mt-20">
          <Reveal>
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Similar work</h2>
                <p className="mt-1 text-[13px] text-mist-400">Buyers also considered these.</p>
              </div>
              <ButtonLink href={`/explore?category=${project.category}`} variant="outline" size="sm">
                More in {category.label}
              </ButtonLink>
            </div>
          </Reveal>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {related.map((item, i) => (
              <ProjectCard key={item.id} project={toCardData(item)} index={i} compact />
            ))}
          </div>
        </section>
      ) : null}
    </Container>
  );
}