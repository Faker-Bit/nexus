"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Filter, Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Select } from "@/components/ui/input";
import { ChipToggle } from "@/components/ui/tabs";
import { Modal } from "@/components/ui/modal";
import { CATEGORIES, SORTS, type SortKey } from "@/lib/constants";
import { cn, formatUSD } from "@/lib/utils";
import { useDebounced } from "@/hooks";

export type ExploreFilters = {
  q: string;
  category: string;
  sort: SortKey;
  language: string;
  license: string;
  minPrice: number | null;
  maxPrice: number | null;
  featured: boolean;
  free: boolean;
  minRating: number;
  tags: string[];
};

export const DEFAULT_FILTERS: ExploreFilters = {
  q: "",
  category: "all",
  sort: "trending",
  language: "",
  license: "",
  minPrice: null,
  maxPrice: null,
  featured: false,
  free: false,
  minRating: 0,
  tags: [],
};

export function filtersToParams(filters: ExploreFilters): Record<string, string> {
  const params: Record<string, string> = { sort: filters.sort };
  if (filters.q.trim()) params.q = filters.q.trim();
  if (filters.category !== "all") params.category = filters.category;
  if (filters.language) params.language = filters.language;
  if (filters.license) params.license = filters.license;
  if (filters.minPrice != null) params.minPrice = String(filters.minPrice);
  if (filters.maxPrice != null) params.maxPrice = String(filters.maxPrice);
  if (filters.featured) params.featured = "1";
  if (filters.free) params.free = "1";
  if (filters.minRating > 0) params.minRating = String(filters.minRating);
  if (filters.tags.length) params.tags = filters.tags.join(",");
  return params;
}

export function parseFilters(sp: URLSearchParams): ExploreFilters {
  const tags = sp.get("tags")?.split(",").filter(Boolean) ?? [];
  const num = (key: string) => {
    const raw = sp.get(key);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  };
  return {
    q: sp.get("q") ?? "",
    category: sp.get("category") ?? "all",
    sort: (sp.get("sort") as SortKey) ?? "trending",
    language: sp.get("language") ?? "",
    license: sp.get("license") ?? "",
    minPrice: num("minPrice"),
    maxPrice: num("maxPrice"),
    featured: sp.get("featured") === "1",
    free: sp.get("free") === "1",
    minRating: Number(sp.get("minRating") ?? 0) || 0,
    tags,
  };
}

export function activeFilterCount(f: ExploreFilters) {
  let n = 0;
  if (f.category !== "all") n++;
  if (f.language) n++;
  if (f.license) n++;
  if (f.minPrice != null) n++;
  if (f.maxPrice != null) n++;
  if (f.featured) n++;
  if (f.free) n++;
  if (f.minRating > 0) n++;
  n += f.tags.length;
  return n;
}

export function ExploreControls({
  facets,
  tags,
  total,
  children,
}: {
  facets: {
    languages: Array<{ value: string; count: number }>;
    licenses: Array<{ value: string; label: string; count: number }>;
    priceMin: number;
    priceMax: number;
  };
  tags: Array<{ name: string; count: number }>;
  total: number;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [sheetOpen, setSheetOpen] = useState(false);

  const filters = useMemo(() => parseFilters(new URLSearchParams(searchParams.toString())), [searchParams]);
  const [draft, setDraft] = useState(filters);
  const [searchInput, setSearchInput] = useState(filters.q);
  const debouncedSearch = useDebounced(searchInput, 380);
  const count = activeFilterCount(filters);

  useEffect(() => setSearchInput(filters.q), [filters.q]);
  useEffect(() => setDraft(filters), [filters]);

  const push = useCallback(
    (next: ExploreFilters) => {
      const params = filtersToParams(next);
      const qs = new URLSearchParams(params).toString();
      startTransition(() => {
        router.push(qs ? `/explore?${qs}` : "/explore", { scroll: false });
      });
      setSheetOpen(false);
    },
    [router],
  );

  useEffect(() => {
    if (debouncedSearch.trim() === filters.q.trim()) return;
    push({ ...filters, q: debouncedSearch });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const toggleTag = (name: string) => {
    const next = draft.tags.includes(name) ? draft.tags.filter((t) => t !== name) : [...draft.tags, name];
    setDraft({ ...draft, tags: next });
    push({ ...draft, tags: next });
  };

  const clearAll = () => {
    const cleared = { ...DEFAULT_FILTERS, q: filters.q, sort: filters.sort };
    setDraft(cleared);
    push(cleared);
  };

  return (
    <div className="space-y-5">
      {/* search + sort bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-mist-500" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search agents, bots, templates, datasets-"
            aria-label="Search projects"
            className="glass h-12 w-full rounded-xl pl-10 pr-10 text-sm text-mist-50 outline-none transition-all placeholder:text-mist-600 focus:border-neon-400/45 focus:ring-2 focus:ring-neon-400/12"
          />
          {searchInput ? (
            <button
              onClick={() => setSearchInput("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-mist-500 hover:bg-white/8 hover:text-mist-50"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="glass"
            size="lg"
            className="lg:hidden"
            icon={<SlidersHorizontal className="size-4" />}
            onClick={() => setSheetOpen(true)}
          >
            Filters{count ? ` (${count})` : ""}
          </Button>
          <Select
            value={filters.sort}
            onChange={(e) => push({ ...filters, sort: e.target.value as SortKey })}
            aria-label="Sort results"
            className="h-12 w-[190px]"
          >
            {SORTS.map((sort) => (
              <option key={sort.key} value={sort.key}>
                {sort.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* category chips */}
      <div className="flex flex-wrap gap-2">
        <ChipToggle active={filters.category === "all"} onClick={() => push({ ...filters, category: "all" })}>
          All categories
        </ChipToggle>
        {CATEGORIES.map((cat) => (
          <ChipToggle
            key={cat.key}
            active={filters.category === cat.key}
            onClick={() => push({ ...filters, category: filters.category === cat.key ? "all" : cat.key })}
          >
            <span className="size-1.5 rounded-full" style={{ background: cat.hue, boxShadow: `0 0 8px ${cat.hue}` }} />
            {cat.label}
          </ChipToggle>
        ))}
      </div>

      {/* mobile sheet */}
      <Modal open={sheetOpen} onClose={() => setSheetOpen(false)} title="Refine results" size="sm">
        <FilterRail
          filters={filters}
          draft={draft}
          setDraft={setDraft}
          apply={() => push(draft)}
          clear={clearAll}
          facets={facets}
          tags={tags}
          toggleTag={toggleTag}
          count={count}
        />
      </Modal>

{/* sidebar + results */}
      <div className="mt-8 grid gap-8 lg:grid-cols-[248px_1fr]">
        {/*
          Rendered on the server and hidden with CSS rather than conditionally.
          A `useMediaQuery` gate would skip hydration on phones, but it would also
          make the rail pop in after hydration on desktop — a visible regression
          for a saving that is inside the run-to-run noise on this page.
        */}
        <aside className="hidden lg:block">
          <FilterSidebar
            filters={filters}
            draft={draft}
            setDraft={setDraft}
            apply={() => push(draft)}
            clear={clearAll}
            facets={facets}
            tags={tags}
            toggleTag={toggleTag}
            count={count}
          />
        </aside>

        <div className="min-w-0">
          <AnimatePresence mode="wait">
            <motion.p
              key={total}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-5 text-[12.5px] text-mist-500"
            >
              <span className="tnum font-medium text-mist-200">{total.toLocaleString()}</span> projects
              {filters.q ? (
                <>
                  {" "}matching{" "}
                  <span className="text-mist-200">“{filters.q}-</span>
                </>
              ) : null}
            </motion.p>
          </AnimatePresence>
          {children}
        </div>
      </div>
    </div>
  );
}

/** Desktop sidebar version of the same controls. */
export function FilterSidebar(props: {
  filters: ExploreFilters;
  draft: ExploreFilters;
  setDraft: (next: ExploreFilters) => void;
  apply: () => void;
  clear: () => void;
  facets: { languages: Array<{ value: string; count: number }>; licenses: Array<{ value: string; label: string; count: number }>; priceMin: number; priceMax: number };
  tags: Array<{ name: string; count: number }>;
  toggleTag: (name: string) => void;
  count: number;
}) {
  return (
    <div className="glass sticky top-24 max-h-[calc(100dvh-8rem)] overflow-y-auto rounded-2xl p-5">
      <FilterRail {...props} />
    </div>
  );
}

function FilterRail({
  filters,
  draft,
  setDraft,
  apply,
  clear,
  facets,
  tags,
  toggleTag,
  count,
}: {
  filters: ExploreFilters;
  draft: ExploreFilters;
  setDraft: (next: ExploreFilters) => void;
  apply: () => void;
  clear: () => void;
  facets: { languages: Array<{ value: string; count: number }>; licenses: Array<{ value: string; label: string; count: number }>; priceMin: number; priceMax: number };
  tags: Array<{ name: string; count: number }>;
  toggleTag: (name: string) => void;
  count: number;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-[13px] font-medium text-mist-100">
          <Filter className="size-3.5 text-neon-400" />
          Filters
          {count ? <span className="tnum rounded-full bg-neon-400/15 px-1.5 py-0.5 text-[10px] text-neon-200">{count}</span> : null}
        </span>
        {count ? (
          <button onClick={clear} className="text-[12px] text-mist-500 transition-colors hover:text-rose-300">
            Reset
          </button>
        ) : null}
      </div>

      <Field label="Price (USD)">
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            value={draft.minPrice ?? ""}
            onChange={(e) => setDraft({ ...draft, minPrice: e.target.value === "" ? null : Number(e.target.value) })}
            placeholder="$0"
            aria-label="Minimum price"
            className="h-10 w-full rounded-lg border border-white/10 bg-ink-900/70 px-2.5 text-[13px] tnum outline-none focus:border-neon-400/50"
          />
          <span className="text-mist-600">-</span>
          <input
            type="number"
            min={0}
            value={draft.maxPrice ?? ""}
            onChange={(e) => setDraft({ ...draft, maxPrice: e.target.value === "" ? null : Number(e.target.value) })}
            placeholder={`${Math.round(facets.priceMax / 100)}`}
            aria-label="Maximum price"
            className="h-10 w-full rounded-lg border border-white/10 bg-ink-900/70 px-2.5 text-[13px] tnum outline-none focus:border-neon-400/50"
          />
        </div>
        <button
          onClick={() => setDraft({ ...draft, free: !draft.free })}
          className={cn(
            "mt-2 w-full rounded-lg border px-3 py-2 text-left text-[12.5px] transition-colors",
            draft.free ? "border-mint/35 bg-mint/8 text-mint" : "border-white/10 text-mist-400 hover:border-white/20",
          )}
        >
          Free projects only
        </button>
        <p className="mt-1.5 text-[11px] text-mist-600">
          Listed range {formatUSD(facets.priceMin)} - {formatUSD(facets.priceMax)}
        </p>
      </Field>

      <Field label="Rating">
        <div className="flex flex-wrap gap-1.5">
          {[4, 4.5, 3.5].map((r) => (
            <ChipToggle key={r} active={draft.minRating === r} onClick={() => setDraft({ ...draft, minRating: draft.minRating === r ? 0 : r })}>
              {r}★ &amp; up
            </ChipToggle>
          ))}
        </div>
      </Field>

      <Field label="Stack">
        <div className="max-h-44 space-y-1 overflow-y-auto pr-1">
          {facets.languages.map((lang) => (
            <Checkbox
              key={lang.value}
              checked={draft.language === lang.value}
              onChange={(on) => setDraft({ ...draft, language: on ? lang.value : "" })}
              label={
                <span className="flex w-full items-center justify-between gap-2">
                  <span>{lang.value}</span>
                  <span className="tnum text-[11px] text-mist-600">{lang.count}</span>
                </span>
              }
            />
          ))}
        </div>
      </Field>

      <Field label="License">
        <div className="space-y-1">
          {facets.licenses.map((lic) => (
            <Checkbox
              key={lic.value}
              checked={draft.license === lic.value}
              onChange={(on) => setDraft({ ...draft, license: on ? lic.value : "" })}
              label={
                <span className="flex w-full items-center justify-between gap-2">
                  <span>{lic.label}</span>
                  <span className="tnum text-[11px] text-mist-600">{lic.count}</span>
                </span>
              }
            />
          ))}
        </div>
      </Field>

      {tags.length ? (
        <Field label="Popular tags">
          <div className="flex flex-wrap gap-1.5">
            {tags.slice(0, 18).map((tag) => (
              <ChipToggle key={tag.name} active={draft.tags.includes(tag.name)} onClick={() => toggleTag(tag.name)}>
                #{tag.name}
              </ChipToggle>
            ))}
          </div>
        </Field>
      ) : null}

      <Button full size="md" onClick={apply} icon={<SlidersHorizontal className="size-4" />}>
        Apply filters
      </Button>

      <p className="text-[11px] leading-relaxed text-mist-600">
        Showing {filters.sort.replace("-", " ")} ordering. Clear a category to widen results.
      </p>
    </div>
  );
}