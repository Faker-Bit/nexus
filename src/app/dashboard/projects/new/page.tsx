import type { Metadata } from "next";
import { Plus, Rocket } from "lucide-react";
import { ProjectWizard } from "@/components/dashboard/project-wizard";
import { PageHeader } from "@/components/ui/section";

export const metadata: Metadata = {
  title: "New project",
  robots: { index: false, follow: false },
};

export default function NewProjectPage() {
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow={
          <>
            <Plus className="size-3" /> Publish
          </>
        }
        title="Publish a project"
        description="Five short steps. Honest metadata beats keyword stuffing - buyers can tell, and reviews follow."
      />
      <div className="glass rounded-2xl p-5 sm:p-7">
        <ProjectWizard />
      </div>

      <div className="glass flex items-start gap-3 rounded-2xl p-5">
        <Rocket className="mt-0.5 size-4 shrink-0 text-neon-300" />
        <p className="text-[12.5px] leading-relaxed text-mist-400">
          Listings that include a live demo, a repository and four or more screenshots see the highest conversion on
          NEXUS. If you ship updates later, buyers get them free - that is what drives repeat sales.
        </p>
      </div>
    </div>
  );
}