import type { Metadata } from "next";
import { Award, Sparkles, TrendingUp, Users } from "lucide-react";
import { listCreators } from "@/lib/queries";
import { prisma } from "@/lib/db";
import { Container, PageHeader } from "@/components/ui/section";
import { CreatorCard } from "@/components/creator/creator-card";
import { Reveal } from "@/components/ui/motion";

export const metadata: Metadata = {
  title: "Creators",
  description: "Meet the developers and creators selling on NEXUS — ranked by sales, ratings and reputation.",
};

export const revalidate = 60;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function CreatorsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const first = (k: string) => (Array.isArray(sp[k]) ? sp[k][0] : sp[k]);
  const sort = first("sort") ?? "earnings";
  const q = first("q") ?? "";

  const result = await listCreators({ sort, q, perPage: 24 });

  const followers = result.items.length
    ? await prisma.follow.groupBy({
        by: ["followingId"],
        where: { followingId: { in: result.items.map((i) => i.id) } },
        _count: { _all: true },
      })
    : [];
  const followerMap = new Map(followers.map((f) => [f.followingId, f._count._all]));

  return (
    <Container className="pb-24">
      <PageHeader
        eyebrow={
          <>
            <Users className="size-3" /> Community
          </>
        }
        title="Creators on NEXUS"
        description="Reputation is earned here — verified identity, delivered files and repeat buyers. Sort by what matters to you."
      >
        <div className="flex gap-2">
          {[
            { key: "earnings", label: "Top earners", icon: Award },
            { key: "sales", label: "Most sales", icon: TrendingUp },
            { key: "newest", label: "Newest", icon: Sparkles },
          ].map((option) => (
            <a
              key={option.key}
              href={`/explore/creators?sort=${option.key}`}
              className={`flex h-10 items-center gap-2 rounded-xl border px-3.5 text-[13px] font-medium transition-all ${
                sort === option.key
                  ? "border-neon-400/45 bg-neon-400/10 text-neon-100"
                  : "border-white/10 text-mist-400 hover:border-white/20 hover:text-mist-100"
              }`}
            >
              <option.icon className="size-3.5" />
              {option.label}
            </a>
          ))}
        </div>
      </PageHeader>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {result.items.map((creator, i) => (
          <Reveal key={creator.id} delay={Math.min(i * 0.04, 0.3)}>
            <CreatorCard
              creator={{
                id: creator.id,
                handle: creator.handle,
                displayName: creator.displayName,
                avatarUrl: creator.avatarUrl,
                bio: creator.bio,
                verified: creator.verified,
                reputation: creator.reputation,
                totalSales: creator.totalSales,
                totalEarningsCents: creator.totalEarningsCents,
                ratingAvg: creator.ratingAvg,
                ratingCount: creator.ratingCount,
                location: creator.location,
                projectCount: creator._count.projects,
                followerCount: followerMap.get(creator.id) ?? creator._count.followers,
              }}
              projects={[]}
            />
          </Reveal>
        ))}
      </div>

      {result.items.length === 0 ? (
        <div className="glass rounded-2xl px-6 py-20 text-center">
          <p className="text-base font-medium">No creators found</p>
          <p className="mt-1 text-sm text-mist-400">Try a different search term.</p>
        </div>
      ) : null}

      <p className="mt-10 text-center text-[12.5px] text-mist-600">
        Showing {result.items.length} of {result.total} creators
      </p>
    </Container>
  );
}
