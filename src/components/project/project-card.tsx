"use client";

import Image from "next/image";
import Link from "next/link";
import { memo, useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Eye, Flame, ShoppingBag, Sparkles, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Stars } from "@/components/ui/rating";
import { Avatar } from "@/components/ui/avatar";
import { cn, coverArtFor, formatCompact, formatUSD } from "@/lib/utils";
import type { CardData } from "@/lib/queries";
import { LikeButton } from "./like-button";

/** Pointer-tracked spotlight + tilt. Kept in a ref to avoid re-renders on move. */
function useCardMotion() {
  const ref = useRef<HTMLDivElement>(null);
  const raf = useRef<number | null>(null);

  const onPointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || raf.current) return;
    const rect = el.getBoundingClientRect();
    raf.current = requestAnimationFrame(() => {
      raf.current = null;
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;
      el.style.setProperty("--mx", `${px * 100}%`);
      el.style.setProperty("--my", `${py * 100}%`);
      el.style.setProperty("--rx", `${(0.5 - py) * 6}deg`);
      el.style.setProperty("--ry", `${(px - 0.5) * 8}deg`);
    });
  }, []);

  const onPointerLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  }, []);

  return { ref, onPointerMove, onPointerLeave };
}

function ProjectCardInner({
  project,
  index = 0,
  rank,
  priority,
  className,
  compact,
}: {
  project: CardData;
  index?: number;
  rank?: number;
  priority?: boolean;
  className?: string;
  compact?: boolean;
}) {
  const { ref, onPointerMove, onPointerLeave } = useCardMotion();
  const [hover, setHover] = useState(false);
  const art = coverArtFor(project.slug);
  const href = `/p/${project.slug}`;

  return (
<motion.article
        initial={{ opacity: 0, y: 26 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-8%" }}
        transition={{ duration: 0.55, delay: Math.min(index * 0.05, 0.3), ease: [0.16, 1, 0.3, 1] }}
        whileHover={{ y: -6 }}
        className={cn("group/card relative [perspective:1400px]", className)}
      >
      <div
        ref={ref}
        onPointerMove={onPointerMove}
        onPointerEnter={() => setHover(true)}
        onPointerLeave={() => {
          setHover(false);
          onPointerLeave();
        }}
className="neon-ring relative h-full rounded-2xl transition-[transform,box-shadow] duration-300 [transform:rotateX(var(--rx,0deg))_rotateY(var(--ry,0deg))_translateZ(0)] [transform-style:preserve-3d] group-hover/card:-translate-y-1"
        style={
          {
            "--ring-color": project.hue,
            "--ring-color-2": "#00e0ff",
            boxShadow: hover
              ? `0 34px 70px -30px ${project.hue}, 0 0 0 1px ${project.hue}2e`
              : undefined,
          } as React.CSSProperties
        }
      >
        <Link
          href={href}
          className="glass relative flex h-full flex-col overflow-hidden rounded-2xl transition-all duration-300 group-hover/card:border-white/14 group-hover/card:bg-white/[0.055]"
          aria-label={`${project.title} - ${formatUSD(project.priceCents)}`}
        >
          {/* media */}
          <div className={cn("relative overflow-hidden", compact ? "aspect-[16/9]" : "aspect-[16/10]")}>
            {project.coverImage ? (
              <Image
                src={project.coverImage}
                alt=""
                fill
                sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 30vw"
                priority={priority}
                fetchPriority={priority ? "high" : "auto"}
                quality={55}
                className="object-cover transition-transform duration-700 ease-out group-hover/card:scale-[1.06]"
              />
            ) : (
              <div className="size-full" style={{ background: art.background }} />
            )}
            <div className="absolute inset-0 bg-linear-to-t from-ink-950/92 via-ink-950/10 to-transparent" />

            {/* spotlight follows the cursor */}
            <div
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/card:opacity-100"
              style={{
                background: `radial-gradient(240px circle at var(--mx, 50%) var(--my, 50%), ${project.hue}22, transparent 68%)`,
              }}
            />

            {/* corner badges */}
            <div className="absolute left-3 top-3 flex flex-wrap items-center gap-1.5">
              {typeof rank === "number" ? (
                <Badge tone="neon" className="backdrop-blur-md">
                  <Flame className="size-3" />#{rank}
                </Badge>
              ) : null}
              {project.featured ? (
                <Badge tone="violet" className="backdrop-blur-md">
                  <Sparkles className="size-3" />Featured
                </Badge>
              ) : null}
              {project.discount > 0 ? <Badge tone="meme" className="backdrop-blur-md">-{project.discount}%</Badge> : null}
              {project.acceptsMeme && project.memeToken ? (
                <Badge tone="meme" className="backdrop-blur-md">
                  <Zap className="size-3" />{project.memeToken}
                </Badge>
              ) : null}
            </div>

            <div className="absolute right-3 top-3 flex items-center gap-1.5 opacity-0 transition-opacity duration-300 group-hover/card:opacity-100">
              <LikeButton
                projectId={project.id}
                initialLiked={false}
                initialCount={project.likeCount}
                className="glass-strong rounded-lg p-1.5 text-mist-200 transition hover:text-rose-300"
              />
            </div>

            {/* price tag */}
            <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-mist-400">
                  {project.categoryLabel}
                </span>
                <span className="tnum font-display text-xl font-semibold text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                  {formatUSD(project.priceCents)}
                  {project.priceCents > 0 ? (
                    <span className="ml-1 text-[11px] font-medium text-mist-300">{project.currency}</span>
                  ) : null}
                </span>
              </div>
              {project.priceCents > 0 && project.originalPriceCents && project.originalPriceCents > project.priceCents ? (
                <span className="tnum text-[12px] text-mist-500 line-through">
                  {formatUSD(project.originalPriceCents)}
                </span>
              ) : null}
            </div>
          </div>

          {/* body */}
          <div className="flex flex-1 flex-col gap-3 p-4">
            <div className="min-w-0">
              <h3 className="truncate text-[15px] font-semibold text-mist-50 transition-colors group-hover/card:text-white">
                {project.title}
              </h3>
              <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-mist-400">{project.tagline}</p>
            </div>

            {project.tags.length ? (
              <div className="flex flex-wrap gap-1.5">
                {project.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md border border-white/8 bg-white/4 px-1.5 py-0.5 font-mono text-[10px] text-mist-400"
                  >
                    {tag}
                  </span>
                ))}
                {project.tags.length > 3 ? (
                  <span className="px-1 text-[10px] text-mist-600">+{project.tags.length - 3}</span>
                ) : null}
              </div>
            ) : null}

            <div className="mt-auto flex items-center justify-between gap-2 border-t border-white/7 pt-3">
              <span className="flex min-w-0 items-center gap-2">
                <Avatar name={project.creator.displayName} src={project.creator.avatarUrl} size="xs" verified={project.creator.verified} />
                <span className="truncate text-[12px] text-mist-400">@{project.creator.handle}</span>
              </span>
              <span className="flex shrink-0 items-center gap-2.5 text-[11.5px] text-mist-500">
                {project.ratingCount > 0 ? (
                  <span className="flex items-center gap-1">
                    <Stars value={project.ratingAvg} size="xs" />
                    <span className="tnum">{project.ratingAvg.toFixed(1)}</span>
                  </span>
                ) : null}
                <span className="flex items-center gap-1 tnum" title={`${project.saleCount} sales`}>
                  <ShoppingBag className="size-3.5" />
                  {formatCompact(project.saleCount)}
                </span>
                <span className="hidden items-center gap-1 tnum sm:flex" title={`${project.viewCount} views`}>
                  <Eye className="size-3.5" />
                  {formatCompact(project.viewCount)}
                </span>
              </span>
            </div>
          </div>

          {/* specular sweep across the artwork on hover */}
          <div
            className={cn(
              "pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 skew-x-[-18deg] bg-linear-to-r from-transparent via-white/12 to-transparent transition-transform duration-700 ease-out",
              hover ? "translate-x-[420%]" : "translate-x-0",
            )}
          />

          {/* hover sheen */}
          <div
            className={cn(
              "pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-300",
              hover ? "opacity-100" : "opacity-0",
            )}
            style={{ boxShadow: `inset 0 0 0 1px ${project.hue}44, inset 0 1px 0 0 ${project.hue}33` }}
          />
        </Link>
      </div>
    </motion.article>
  );
}

/*
 * A landing page renders 30+ cards. Card props are stable references from the
 * server payload, so memoising stops every unrelated state change in the shell
 * (wallet, menus, toasts) from re-rendering all of them.
 */
export const ProjectCard = memo(ProjectCardInner);

/** Dense row used in rails, sidebars and the library. */
export const ProjectRow = memo(function ProjectRow({
  project,
  className,
  right,
}: {
  project: CardData;
  className?: string;
  right?: React.ReactNode;
}) {
  const art = coverArtFor(project.slug);
  return (
    <Link
      href={`/p/${project.slug}`}
      className={cn(
        "group flex items-center gap-3.5 rounded-xl border border-white/7 bg-white/[0.025] p-2.5 transition-all hover:border-white/14 hover:bg-white/5",
        className,
      )}
    >
      <div className="relative size-12 shrink-0 overflow-hidden rounded-lg">
        {project.coverImage ? (
          <Image src={project.coverImage} alt="" fill sizes="48px" className="object-cover transition-transform duration-500 group-hover:scale-110" />
        ) : (
          <div className="size-full" style={{ background: art.background }} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13.5px] font-medium text-mist-50">{project.title}</p>
        <p className="truncate text-[11.5px] text-mist-500">
          @{project.creator.handle} · {project.categoryLabel}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="tnum text-[13px] font-medium text-mist-50">{formatUSD(project.priceCents)}</p>
        <p className="tnum text-[11px] text-mist-500">{formatCompact(project.saleCount)} sales</p>
      </div>
      {right}
    </Link>
  );
});
