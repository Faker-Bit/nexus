import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Pencil } from "lucide-react";
import { prisma } from "@/lib/db";
import { loadUser } from "@/lib/auth";
import { ProjectWizard } from "@/components/dashboard/project-wizard";
import { PageHeader } from "@/components/ui/section";
import { ButtonLink } from "@/components/ui/button";
import { parseTags } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Edit project",
  robots: { index: false, follow: false },
};

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await loadUser();
  if (!user) redirect("/login");

  const project = await prisma.project.findUnique({
    where: { id },
    include: { assets: { orderBy: { position: "asc" } }, tags: true },
  });
  if (!project) notFound();
  if (project.creatorId !== user.id) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <h1 className="text-xl font-semibold">That is not your project</h1>
        <p className="mt-2 text-[13.5px] text-mist-400">You can only edit listings on your own storefront.</p>
        <ButtonLink href="/dashboard/projects" className="mt-5">
          Back to your projects
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow={
          <>
            <Pencil className="size-3" /> Edit
          </>
        }
        title={project.title}
        description="Changes go live immediately. Sold buyers keep access even if you archive the listing later."
      >
        <ButtonLink href={`/p/${project.slug}`} variant="secondary" size="sm">
          View listing
        </ButtonLink>
      </PageHeader>

      <div className="glass rounded-2xl p-5 sm:p-7">
        <ProjectWizard
          initial={{
            id: project.id,
            title: project.title,
            tagline: project.tagline,
            description: project.description,
            category: project.category,
            language: project.language,
            license: project.license,
            tags: project.tags.length ? project.tags.map((t) => t.name) : parseTags(project.tagsString),
            priceCents: project.priceCents,
            currency: project.currency,
            chain: project.chain,
            acceptsOffers: project.acceptsOffers,
            acceptsMeme: project.acceptsMeme,
            memeToken: project.memeToken,
            demoUrl: project.demoUrl,
            repoUrl: project.repoUrl,
            docsUrl: project.docsUrl,
            websiteUrl: project.websiteUrl,
            previewVideo: project.previewVideo,
            fileName: project.fileName,
            fileSizeBytes: project.fileSizeBytes,
            status: project.status,
            assets: project.assets.map((a) => ({ id: a.id, kind: a.kind as "screenshot", url: a.url, alt: a.alt ?? "" })),
          }}
        />
      </div>
    </div>
  );
}