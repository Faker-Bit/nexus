"use client";

import { useCallback, useState, useTransition } from "react";
import { Loader2, SearchX } from "lucide-react";
import { ProjectCard } from "./project-card";
import { Button } from "@/components/ui/button";
import type { CardData } from "@/lib/queries";
import { useToast } from "@/components/ui/toast";

export function ProjectGrid({
  initial,
  total,
  query,
  perPage = 12,
  priorityCount = 3,
  emptyState,
}: {
  initial: CardData[];
  total: number;
  query: Record<string, string | number | undefined>;
  perPage?: number;
  priorityCount?: number;
  emptyState?: React.ReactNode;
}) {
  const [items, setItems] = useState(initial);
  const [page, setPage] = useState(1);
  const [loading, startTransition] = useTransition();
  const [exhausted, setExhausted] = useState(initial.length >= total);
  const toast = useToast();

  const loadMore = useCallback(() => {
    const next = page + 1;
    startTransition(async () => {
      try {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(query)) {
          if (value !== undefined && value !== "") params.set(key, String(value));
        }
        params.set("page", String(next));
        params.set("perPage", String(perPage));

        const res = await fetch(`/api/projects?${params.toString()}`);
        const body = await res.json();
        if (!res.ok) throw new Error(body?.error?.message ?? "Request failed");

        const incoming = body.data.items as CardData[];
        setItems((current) => {
          const seen = new Set(current.map((i) => i.id));
          return [...current, ...incoming.filter((i) => !seen.has(i.id))];
        });
        setPage(next);
        if (body.data.items.length < perPage) setExhausted(true);
      } catch (err) {
        toast.error("Could not load more", err instanceof Error ? err.message : undefined);
      }
    });
  }, [page, perPage, query, toast]);

  if (!items.length) {
    return (
      <div className="glass flex flex-col items-center gap-3 rounded-2xl px-6 py-20 text-center">
        <div className="grid size-14 place-items-center rounded-2xl bg-white/4 text-mist-400">
          <SearchX className="size-6" />
        </div>
        <p className="text-base font-medium text-mist-50">Nothing matches those filters</p>
        <p className="max-w-sm text-sm text-mist-400">
          {emptyState ?? "Try widening the price range, clearing a category, or searching for something broader."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((project, i) => (
          <ProjectCard key={project.id} project={project} index={i} priority={i < priorityCount} />
        ))}
      </div>

      {!exhausted ? (
        <div className="flex justify-center">
          <Button variant="outline" size="lg" onClick={loadMore} loading={loading} icon={!loading ? undefined : undefined}>
            {loading ? "Loading-" : `Load more (${items.length} of ${total})`}
          </Button>
        </div>
      ) : items.length > perPage ? (
        <p className="text-center text-[12.5px] text-mist-600">
          <Loader2 className="mr-1.5 inline size-3" />
          You have reached the end - {items.length} projects.
        </p>
      ) : null}
    </div>
  );
}

export function ProjectGridSkeleton({ count = 6, className }: { count?: number; className?: string }) {
  return (
    <div className={`grid gap-5 sm:grid-cols-2 xl:grid-cols-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass overflow-hidden rounded-2xl">
          <div className="skeleton aspect-[16/10] w-full" />
          <div className="space-y-2.5 p-4">
            <div className="skeleton h-4 w-2/3 rounded-md" />
            <div className="skeleton h-3 w-full rounded-md" />
            <div className="skeleton h-3 w-4/5 rounded-md" />
            <div className="flex items-center justify-between pt-2">
              <div className="skeleton h-6 w-20 rounded-full" />
              <div className="skeleton h-3 w-16 rounded-md" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}