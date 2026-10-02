"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Archive,
  BarChart3,
  Eye,
  Heart,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  ShoppingBag,
  Star,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { ChipToggle } from "@/components/ui/tabs";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { CATEGORY_MAP } from "@/lib/constants";
import { cn, formatCompact, formatDate, formatUSD, timeAgo } from "@/lib/utils";

export type ManagedProject = {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  category: string;
  status: string;
  priceCents: number;
  currency: string;
  coverImage: string | null;
  featured: boolean;
  saleCount: number;
  viewCount: number;
  likeCount: number;
  ratingAvg: number;
  ratingCount: number;
  trendingScore: number;
  publishedAt: Date | null;
  updatedAt: Date;
  _count: { orders: number; reviews: number; offers: number };
};

const STATUS_TONE = { published: "mint", draft: "amber", archived: "neutral" } as const;

export function ProjectsManager({
  projects,
  counts,
}: {
  projects: ManagedProject[];
  counts: Record<string, number>;
}) {
  const [status, setStatus] = useState<"all" | "published" | "draft" | "archived">("all");
  const [query, setQuery] = useState("");
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ManagedProject | null>(null);

  const filtered = useMemo(() => {
    return projects.filter((project) => {
      if (status !== "all" && project.status !== status) return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return project.title.toLowerCase().includes(q) || project.category.includes(q);
    });
  }, [projects, status, query]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {(["all", "published", "draft", "archived"] as const).map((key) => (
            <ChipToggle
              key={key}
              active={status === key}
              onClick={() => setStatus(key)}
              count={key === "all" ? projects.length : (counts[key] ?? 0)}
            >
              {key === "all" ? "All" : key.charAt(0).toUpperCase() + key.slice(1)}
            </ChipToggle>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1 sm:flex-none">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-mist-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter projects"
              aria-label="Filter projects"
              className="h-10 w-full rounded-xl border border-white/10 bg-ink-900/60 pl-9 pr-3 text-[13px] outline-none focus:border-neon-400/50 sm:w-56"
            />
          </div>
          <ButtonLink href="/dashboard/projects/new" icon={<Plus className="size-4" />} className="shrink-0">
            <span className="hidden sm:inline">New project</span>
            <span className="sm:hidden">New</span>
          </ButtonLink>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="glass flex flex-col items-center gap-3 rounded-2xl px-6 py-20 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-white/4 text-mist-400">
            <Plus className="size-6" />
          </span>
          <p className="text-[15px] font-medium">
            {projects.length ? "Nothing matches that filter" : "No projects yet"}
          </p>
          <p className="max-w-sm text-[13px] text-mist-400">
            {projects.length
              ? "Try another status or clear the search."
              : "Publish your first listing and it appears in explore within minutes."}
          </p>
          {!projects.length ? <ButtonLink href="/dashboard/projects/new">Start the wizard</ButtonLink> : null}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((project, i) => (
            <motion.article
              key={project.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: Math.min(i * 0.03, 0.2) }}
              className="glass group relative rounded-2xl p-4"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3.5">
                  <div
                    className="relative size-14 shrink-0 overflow-hidden rounded-xl"
                    style={{ background: `linear-gradient(135deg, ${CATEGORY_MAP[project.category]?.hue ?? "#00ff9d"}33, #04140c)` }}
                  >
                    <div className="grid size-full place-items-center text-[11px] font-bold text-white/70">
                      {(CATEGORY_MAP[project.category]?.label ?? project.category).slice(0, 2).toUpperCase()}
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/p/${project.slug}`}
                        className="truncate text-[14.5px] font-medium text-mist-50 transition-colors hover:text-neon-200"
                      >
                        {project.title}
                      </Link>
                      <Badge size="sm" tone={STATUS_TONE[project.status as keyof typeof STATUS_TONE] ?? "neutral"} dot>
                        {project.status}
                      </Badge>
                      {project.featured ? (
                        <Badge size="sm" tone="violet">
                          Featured
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 line-clamp-1 text-[12.5px] text-mist-500">{project.tagline}</p>
                    <p className="mt-1 text-[11px] text-mist-600">
                      Updated {timeAgo(project.updatedAt)}
                      {project.publishedAt ? ` · published ${formatDate(project.publishedAt)}` : ""}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center sm:w-[280px]">
                  {[
                    { label: "Price", value: formatUSD(project.priceCents) },
                    { label: "Views", value: formatCompact(project.viewCount) },
                    { label: "Sales", value: String(project.saleCount) },
                    { label: "Rating", value: project.ratingCount ? project.ratingAvg.toFixed(1) : "-" },
                  ].map((cell) => (
                    <div key={cell.label}>
                      <p className="tnum text-[13.5px] font-medium text-mist-100">{cell.value}</p>
                      <p className="text-[9.5px] uppercase tracking-wider text-mist-600">{cell.label}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-end gap-1.5">
                  <Link
                    href={`/dashboard/projects/${project.id}`}
                    className="inline-flex size-9 items-center justify-center rounded-lg border border-white/10 text-mist-400 transition-colors hover:border-neon-400/40 hover:text-mist-50"
                    aria-label="Edit project"
                    title="Edit"
                  >
                    <Pencil className="size-3.5" />
                  </Link>
                  <button
                    onClick={() => setMenuFor(menuFor === project.id ? null : project.id)}
                    className="inline-flex size-9 items-center justify-center rounded-lg border border-white/10 text-mist-400 transition-colors hover:border-white/25 hover:text-mist-50"
                    aria-label="More actions"
                  >
                    <MoreHorizontal className="size-4" />
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {menuFor === project.id ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 flex flex-wrap gap-2 border-t border-white/8 pt-3">
                      <Link
                        href={`/p/${project.slug}`}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 px-3 text-[12.5px] text-mist-300 hover:text-mist-50"
                      >
                        <Eye className="size-3.5" /> View listing
                      </Link>
                      <Link
                        href={`/dashboard/sales?project=${project.id}`}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 px-3 text-[12.5px] text-mist-300 hover:text-mist-50"
                      >
                        <BarChart3 className="size-3.5" /> Sales ({project.saleCount})
                      </Link>
                      <span className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 px-3 text-[12.5px] text-mist-400">
                        <Heart className="size-3.5" /> {project.likeCount}
                      </span>
                      <span className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 px-3 text-[12.5px] text-mist-400">
                        <Star className="size-3.5" /> {project.ratingCount}
                      </span>
                      <span className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 px-3 text-[12.5px] text-mist-400">
                        <ShoppingBag className="size-3.5" /> {project._count.orders} orders
                      </span>
                      <button
                        onClick={() => setConfirmDelete(project)}
                        className={cn(
                          "ml-auto inline-flex h-9 items-center gap-1.5 rounded-lg border border-rose-400/25 px-3 text-[12.5px] text-rose-200 transition-colors hover:bg-rose-400/10",
                        )}
                      >
                        {project._count.orders > 0 ? <Archive className="size-3.5" /> : <Trash2 className="size-3.5" />}
                        {project._count.orders > 0 ? "Archive" : "Delete"}
                      </button>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </motion.article>
          ))}
        </div>
      )}

      <DeleteProjectDialog project={confirmDelete} onClose={() => setConfirmDelete(null)} />
    </div>
  );
}

function DeleteProjectDialog({
  project,
  onClose,
}: {
  project: ManagedProject | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function run() {
    if (!project) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error?.message ?? "Could not remove the project.");
      toast.success(
        body.data.archived ? "Project archived" : "Project deleted",
        body.data.archived
          ? "Existing buyers keep their downloads. The listing is hidden from explore."
          : "The listing and its assets are gone.",
      );
      onClose();
      router.refresh();
    } catch (err) {
      toast.error("Action failed", err instanceof Error ? err.message : undefined);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={Boolean(project)}
      onClose={onClose}
      title={project && project._count.orders > 0 ? "Archive this project?" : "Delete this project?"}
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={busy}
            onClick={() => {
              void run();
              onClose();
            }}
          >
            {project && project._count.orders > 0 ? "Archive" : "Delete"}
          </Button>
        </div>
      }
    >
      <p className="text-[13.5px] leading-relaxed text-mist-300">
        {project && project._count.orders > 0
          ? `“${project.title}” has ${project._count.orders} order${
              project._count.orders === 1 ? "" : "s"
            }. It will be hidden from the marketplace, but existing buyers keep access to their files and licence keys.`
          : `“${project?.title ?? ""}” will be permanently removed, along with its screenshots and tags. This cannot be undone.`}
      </p>
    </Modal>
  );
}

