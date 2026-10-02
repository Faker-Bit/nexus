import type { Metadata } from "next";
import { Store } from "lucide-react";
import { prisma } from "@/lib/db";
import { loadUser } from "@/lib/auth";
import { ProjectsManager } from "@/components/dashboard/projects-manager";
import { PageHeader } from "@/components/ui/section";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Projects",
  robots: { index: false, follow: false },
};

export default async function DashboardProjectsPage() {
  const user = await loadUser();
  if (!user) return null;

  const [projects, counts] = await Promise.all([
    prisma.project.findMany({
      where: { creatorId: user.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        slug: true,
        title: true,
        tagline: true,
        category: true,
        status: true,
        priceCents: true,
        currency: true,
        coverImage: true,
        featured: true,
        saleCount: true,
        viewCount: true,
        likeCount: true,
        ratingAvg: true,
        ratingCount: true,
        trendingScore: true,
        publishedAt: true,
        updatedAt: true,
        _count: { select: { orders: true, reviews: true, offers: true } },
      },
    }),
    prisma.project.groupBy({ by: ["status"], where: { creatorId: user.id }, _count: { _all: true } }),
  ]);

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow={
          <>
            <Store className="size-3" /> Catalogue
          </>
        }
        title="Your projects"
        description="Edit pricing, track performance and manage visibility. Archived listings keep existing buyers' access."
      />
      <ProjectsManager projects={projects} counts={Object.fromEntries(counts.map((c) => [c.status, c._count._all]))} />
    </div>
  );
}