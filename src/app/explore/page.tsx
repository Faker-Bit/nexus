import type { Metadata } from "next";
import { Suspense } from "react";
import { Search } from "lucide-react";
import { discoverySchema } from "@/lib/validation";
import { discoverProjects, getFacetValues, getTagCloud, toCardData } from "@/lib/queries";
import { Container, PageHeader } from "@/components/ui/section";
import { ProjectGrid, ProjectGridSkeleton } from "@/components/project/project-grid";
import { ExploreControls } from "@/components/project/explore-controls";
import { RevealText } from "@/components/ui/effects";
import { SceneZone } from "@/components/three/webgl-zone";
import { CATEGORIES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Explore projects",
  description:
    "Search agent runtimes, bots, templates, scripts and datasets. Filter by category, stack, license and price. Buy with crypto.",
};

export const revalidate = 30;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ExplorePage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const first = (key: string) => {
    const value = sp[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const input = discoverySchema.parse({
    q: first("q"),
    category: first("category"),
    tags: first("tags"),
    language: first("language"),
    license: first("license"),
    minPrice: first("minPrice"),
    maxPrice: first("maxPrice"),
    sort: first("sort") ?? "trending",
    featured: first("featured"),
    free: first("free"),
    minRating: first("minRating"),
    page: first("page") ?? 1,
    perPage: 12,
  });

  const [results, facets, tags] = await Promise.all([discoverProjects(input), getFacetValues(), getTagCloud(22)]);

  const query: Record<string, string | number | undefined> = {
    ...(input.q ? { q: input.q } : {}),
    ...(input.category && input.category !== "all" ? { category: input.category } : {}),
    ...(input.tags ? { tags: input.tags } : {}),
    ...(input.language ? { language: input.language } : {}),
    ...(input.license ? { license: input.license } : {}),
    ...(input.minPrice != null ? { minPrice: input.minPrice } : {}),
    ...(input.maxPrice != null ? { maxPrice: input.maxPrice } : {}),
    ...(input.featured ? { featured: 1 } : {}),
    ...(input.free ? { free: 1 } : {}),
    ...(input.minRating ? { minRating: input.minRating } : {}),
    sort: input.sort,
  };

  const activeCategory = CATEGORIES.find((c) => c.key === input.category);

return (
    <div className="relative isolate">
      <SceneZone scene="wave" settings={{ distance: 10, fov: 52, bloom: 0.6 }}
          
        tone="emerald"
        margin="280px 0px"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px] opacity-70"
              />
      <Container className="pb-24">
        <PageHeader
          eyebrow={
            <>
              <Search className="size-3" /> Discovery
            </>
          }
          title={
            activeCategory ? (
              <RevealText>{activeCategory.label}</RevealText>
            ) : input.q ? (
              <RevealText>{`Results for ${input.q}`}</RevealText>
            ) : (
              <RevealText>Explore the marketplace</RevealText>
            )
          }
          description={
            activeCategory
              ? activeCategory.blurb
              : "Every listing is checked for working files and honest descriptions. Filter hard — the good stuff survives it."
          }
        />

      <Suspense fallback={<div className="glass h-24 rounded-2xl" />}>
          <ExploreControls facets={facets} tags={tags} total={results.total}>
            <Suspense fallback={<ProjectGridSkeleton />}>
              <ProjectGrid initial={results.items.map(toCardData)} total={results.total} query={query} perPage={12} />
            </Suspense>
          </ExploreControls>
        </Suspense>
      </Container>
    </div>
  );
}