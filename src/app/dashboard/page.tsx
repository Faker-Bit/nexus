import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Eye, HandCoins as OfferIcon, Plus } from "lucide-react";
import { getDashboardStats, getSales } from "@/lib/queries";
import { loadUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CategoryDonut, RevenueChart, StatCard, StatGlyph, ViewsChart } from "@/components/dashboard/charts";
import { SceneZone } from "@/components/three/webgl-zone";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Stars } from "@/components/ui/rating";
import { Avatar } from "@/components/ui/avatar";
import { Reveal } from "@/components/ui/motion";
import { CATEGORY_MAP } from "@/lib/constants";
import { formatCompact, formatDate, formatUSD, timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Creator dashboard",
  robots: { index: false, follow: false },
};

/** Buckets transaction rows into one point per day for the last 30 days. */
function buildSeries<T extends { createdAt: Date }>(rows: T[], value: (row: T) => number) {
  const days: Array<{ date: string; label: string; revenue: number; sales: number; views: number }> = [];
  const index = new Map<string, number>();

  for (let i = 29; i >= 0; i--) {
    const day = new Date(Date.now() - i * 86400000);
    const key = day.toISOString().slice(0, 10);
    index.set(key, days.length);
    days.push({
      date: key,
      label: day.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      revenue: 0,
      sales: 0,
      views: 0,
    });
  }

  for (const row of rows) {
    const key = row.createdAt.toISOString().slice(0, 10);
    const at = index.get(key);
    if (at !== undefined) days[at].revenue += value(row);
  }

  return days;
}

export default async function DashboardPage() {
  const user = await loadUser();
  if (!user) return null;

  const stats = await getDashboardStats(user.id);
  const [sales, notifications] = await Promise.all([
    getSales(user.id, 1, 6),
    prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 6 }),
  ]);
  const revenue = buildSeries(stats.revenueRows, (row) => row.amountCents);

  const viewsByDay = new Map<string, number>();
  for (const row of stats.viewRows) {
    const key = row.createdAt.toISOString().slice(0, 10);
    viewsByDay.set(key, (viewsByDay.get(key) ?? 0) + row._count._all);
  }
  const views = revenue.map((day) => ({ date: day.label, views: viewsByDay.get(day.date) ?? 0 }));

  const categorySplit = Object.entries(
    stats.projects.reduce<Record<string, number>>((acc, p) => {
      acc[p.category] = (acc[p.category] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([key, value]) => ({
    label: CATEGORY_MAP[key]?.label ?? key,
    value,
    hue: CATEGORY_MAP[key]?.hue ?? "#00ff9d",
  }));

  const delta =
    stats.totals.prevRevenueCents > 0
      ? ((stats.totals.revenueCents - stats.totals.prevRevenueCents) / stats.totals.prevRevenueCents) * 100
      : null;

  const totalViews = stats.projects.reduce((acc, p) => acc + p.viewCount, 0);
  const conversion = totalViews > 0 ? (stats.totals.sales / totalViews) * 100 : 0;

  return (
    <div className="relative isolate space-y-8">
      <SceneZone
        scene="wave"
        settings={{ distance: 11, fov: 52, bloom: 0.5, opacity: 0.35 }}
        tone="emerald"
        margin="280px 0px"
        className="pointer-events-none absolute inset-x-0 -top-8 -z-10 h-[320px] opacity-55"
      />
      <Reveal>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[12.5px] text-mist-500">Welcome back, {user.displayName.split(" ")[0]}</p>
            <h1 className="mt-1 text-[clamp(1.6rem,3.4vw,2.2rem)] font-semibold">Your storefront at a glance</h1>
          </div>
          <div className="flex gap-2">
            <ButtonLink href={`/c/${user.handle}`} variant="secondary" size="sm">
              View public profile
            </ButtonLink>
            <ButtonLink href="/dashboard/projects/new" size="sm" icon={<Plus className="size-4" />}>
              New project
            </ButtonLink>
          </div>
        </div>
      </Reveal>

      {stats.totals.totalProjects === 0 ? (
        <div className="glass flex flex-col items-center gap-4 rounded-2xl px-6 py-20 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-white/4 text-neon-300">
            <Plus className="size-6" />
          </span>
          <h2 className="text-lg font-semibold">Publish your first project</h2>
          <p className="max-w-md text-[13.5px] leading-relaxed text-mist-400">
            Add screenshots, a demo link and the archive. Buyers see it in search within minutes - and you keep
            92% of whatever it sells for.
          </p>
          <ButtonLink href="/dashboard/projects/new" icon={<ArrowRight className="size-4" />}>
            Start the upload wizard
          </ButtonLink>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Net revenue"
          value={formatUSD(stats.totals.revenueCents)}
          delta={delta}
          icon="coins"
          hint="Last 30 days, after fees"
          accent="mint"
        />
        <StatCard
          label="Sales"
          value={String(stats.totals.sales)}
          hint={`${formatUSD(stats.totals.avgOrderCents)} average order`}
          icon="shoppingBag"
          accent="neon"
        />
        <StatCard
          label="Conversion"
          value={`${conversion.toFixed(2)}%`}
          hint={`${formatCompact(totalViews)} views across ${stats.totals.totalProjects} projects`}
          icon="mouse"
          accent="violet"
        />
        <StatCard
          label="Pending"
          value={String(stats.totals.pendingOffers + stats.totals.awaitReviews)}
          hint={`${stats.totals.pendingOffers} offers · ${stats.totals.awaitReviews} reviews to write`}
          icon="handshake"
          accent="amber"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <Reveal className="glass rounded-2xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-semibold">Revenue</h2>
              <p className="text-[12px] text-mist-500">Net of the 8% platform fee · last 30 days</p>
            </div>
            <Badge tone="mint" dot>
              {formatUSD(stats.totals.revenueCents)}
            </Badge>
          </div>
          <RevenueChart data={revenue} />
        </Reveal>

        <Reveal delay={0.06} className="glass rounded-2xl p-5">
          <div className="mb-4">
            <h2 className="text-[15px] font-semibold">Catalogue mix</h2>
            <p className="text-[12px] text-mist-500">Where your projects sit</p>
          </div>
          <CategoryDonut data={categorySplit} />
        </Reveal>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <Reveal className="glass rounded-2xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-semibold">Traffic</h2>
              <p className="text-[12px] text-mist-500">Views across your listings · last 30 days</p>
            </div>
            <Badge tone="neon">
              <Eye className="size-3" />
              {formatCompact(totalViews)}
            </Badge>
          </div>
          <ViewsChart data={views} />
        </Reveal>

        <Reveal delay={0.06} className="glass rounded-2xl p-5">
          <h2 className="text-[15px] font-semibold">Top earners</h2>
          <p className="mb-4 text-[12px] text-mist-500">Ranked by realised revenue</p>
          {stats.topProjects.length ? (
            <div className="space-y-3">
              {stats.topProjects.slice(0, 5).map((row) => (
                <Link
                  key={row.project.id}
                  href={`/dashboard/projects/${row.project.id}`}
                  className="group flex items-center gap-3 rounded-xl border border-white/7 bg-white/[0.02] p-3 transition-colors hover:border-neon-400/30"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-mist-100">{row.project.title}</p>
                    <p className="tnum text-[11.5px] text-mist-500">{row.sales} sales</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="tnum text-[13px] font-medium text-mint">{formatUSD(row.revenue)}</p>
                    <ArrowUpRight className="ml-auto mt-0.5 size-3 text-mist-600 transition-transform group-hover:-translate-y-0.5" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="py-10 text-center text-[13px] text-mist-500">No sales yet - the graph starts moving on day one.</p>
          )}
        </Reveal>
      </div>

      <Reveal className="glass rounded-2xl p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-semibold">Recent sales</h2>
            <p className="text-[12px] text-mist-500">Latest settled orders</p>
          </div>
          <Link href="/dashboard/sales" className="flex items-center gap-1 text-[12.5px] text-neon-300 hover:text-neon-200">
            All sales <ArrowRight className="size-3.5" />
          </Link>
        </div>

        {sales.items.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-[13px]">
              <thead className="border-b border-white/8 text-[11px] uppercase tracking-wider text-mist-500">
                <tr>
                  <th className="pb-2.5 font-medium">Project</th>
                  <th className="pb-2.5 font-medium">Buyer</th>
                  <th className="pb-2.5 font-medium">Your cut</th>
                  <th className="pb-2.5 font-medium">Fee</th>
                  <th className="pb-2.5 font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {sales.items.map((order) => (
                  <tr key={order.id} className="border-b border-white/5 last:border-0">
                    <td className="py-3 pr-3">
                      <Link href={`/p/${order.project.slug}`} className="text-mist-100 hover:text-neon-200">
                        {order.project.title}
                      </Link>
                    </td>
                    <td className="py-3 pr-3">
                      <span className="flex items-center gap-2 text-mist-400">
                        <Avatar name={order.buyer.displayName} src={order.buyer.avatarUrl} size="xs" />
                        @{order.buyer.handle}
                      </span>
                    </td>
                    <td className="tnum py-3 pr-3 text-mint">{formatUSD(order.sellerPayoutCents)}</td>
                    <td className="tnum py-3 pr-3 text-mist-500">{formatUSD(order.platformFeeCents)}</td>
                    <td className="py-3 text-mist-500">{timeAgo(order.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-10 text-center text-[13px] text-mist-500">No sales recorded yet.</p>
        )}
      </Reveal>

      {stats.projects.length ? (
        <Reveal className="glass rounded-2xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-semibold">Listing health</h2>
              <p className="text-[12px] text-mist-500">Quick read on each project</p>
            </div>
            <Link href="/dashboard/projects" className="flex items-center gap-1 text-[12.5px] text-neon-300 hover:text-neon-200">
              Manage <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {stats.projects.slice(0, 6).map((project) => {
              const views = project.viewCount || 1;
              const cr = ((project.saleCount / views) * 100).toFixed(2);
              return (
                <Link
                  key={project.id}
                  href={`/dashboard/projects/${project.id}`}
                  className="group rounded-xl border border-white/7 bg-white/[0.02] p-4 transition-colors hover:border-neon-400/30"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 truncate text-[13.5px] font-medium text-mist-50">{project.title}</p>
                    <Badge
                      size="sm"
                      tone={project.status === "published" ? "mint" : project.status === "draft" ? "amber" : "neutral"}
                    >
                      {project.status}
                    </Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                    {[
                      { label: "Views", value: formatCompact(project.viewCount) },
                      { label: "Sales", value: String(project.saleCount) },
                      { label: "CR", value: `${cr}%` },
                      {
                        label: "Rating",
                        value: project.ratingCount ? project.ratingAvg.toFixed(1) : "-",
                      },
                    ].map((cell) => (
                      <div key={cell.label}>
                        <p className="tnum text-[13px] font-medium text-mist-100">{cell.value}</p>
                        <p className="text-[9.5px] uppercase tracking-wider text-mist-600">{cell.label}</p>
                      </div>
                    ))}
                  </div>
                  {project.ratingCount > 0 ? (
                    <div className="mt-3 flex items-center gap-1.5 border-t border-white/7 pt-2.5">
                      <Stars value={project.ratingAvg} size="xs" />
                      <span className="text-[11px] text-mist-500">from {project.ratingCount} buyers</span>
                    </div>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </Reveal>
      ) : null}

      {notifications.length ? (
        <Reveal className="glass rounded-2xl p-5">
          <h2 className="mb-4 flex items-center gap-2 text-[15px] font-semibold">
            <OfferIcon className="size-4 text-neon-300" />
            Recent activity
          </h2>
          <div className="space-y-2">
            {notifications.map((note) => (
              <div key={note.id} className="flex items-start gap-3 rounded-xl border border-white/7 bg-white/[0.02] p-3">
                <span className="mt-1 size-2 shrink-0 rounded-full bg-neon-400/70" />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] text-mist-100">{note.title}</p>
                  {note.body ? <p className="text-[12px] text-mist-500">{note.body}</p> : null}
                  <p className="mt-0.5 text-[11px] text-mist-600">{timeAgo(note.createdAt)}</p>
                </div>
                {note.link ? (
                  <Link href={note.link} className="shrink-0 text-[12px] text-neon-300 hover:text-neon-200">
                    Open
                  </Link>
                ) : null}
              </div>
            ))}
          </div>
        </Reveal>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: "trending" as const, label: "Trending score", value: stats.projects[0]?.trendingScore?.toFixed(1) ?? "0.0", hint: "Highest of your listings" },
          { icon: "star" as const, label: "Avg rating", value: stats.projects.filter((p) => p.ratingCount > 0).length ? (stats.projects.reduce((a, p) => a + p.ratingAvg, 0) / Math.max(1, stats.projects.filter((p) => p.ratingCount > 0).length)).toFixed(1) : "-", hint: "Across rated projects" },
          { icon: "eye" as const, label: "Featured listings", value: String(stats.projects.filter((p) => p.featured).length), hint: `of ${formatDate(new Date())}` },
        ].map((card) => (
          <div key={card.label} className="glass flex items-center gap-3.5 rounded-2xl p-4">
            <span className="grid size-10 place-items-center rounded-xl bg-neon-400/12 text-neon-300">
              <StatGlyph name={card.icon} className="size-4" />
            </span>
            <div>
              <p className="tnum text-[17px] font-semibold text-mist-50">{card.value}</p>
              <p className="text-[11.5px] text-mist-500">{card.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}