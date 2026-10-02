import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart3, ExternalLink, Wallet } from "lucide-react";
import { getSales } from "@/lib/queries";
import { loadUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/section";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { RevenueChart, StatCard } from "@/components/dashboard/charts";
import { formatDateTime, formatUSD, txUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sales",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ page?: string }>;

export default async function SalesPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await loadUser();
  if (!user) redirect("/login?next=/dashboard/sales");

  const { page = "1" } = await searchParams;
  const pageNum = Math.max(1, Number(page) || 1);

  const [sales, revenueRows] = await Promise.all([
    getSales(user.id, pageNum, 15),
    prisma.order.findMany({
      where: { sellerId: user.id, status: "paid" },
      orderBy: { createdAt: "desc" },
      take: 120,
      select: { sellerPayoutCents: true, createdAt: true },
    }),
  ]);

  const days: Array<{ date: string; label: string; revenue: number }> = [];
  const index = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    const day = new Date(Date.now() - i * 86400000);
    const key = day.toISOString().slice(0, 10);
    index.set(key, days.length);
    days.push({ date: key, label: day.toLocaleDateString("en-US", { month: "short", day: "numeric" }), revenue: 0 });
  }
  for (const row of revenueRows) {
    const at = index.get(row.createdAt.toISOString().slice(0, 10));
    if (at !== undefined) days[at].revenue += row.sellerPayoutCents;
  }

  const total30 = days.reduce((acc, d) => acc + d.revenue, 0);

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow={
          <>
            <BarChart3 className="size-3" /> Revenue
          </>
        }
        title="Sales"
        description="Every settled order, what you cleared, and what the platform took. Figures are net of the 8% fee."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Net, all time"
          value={formatUSD(sales.sumCents)}
          icon="coins"
          accent="mint"
          hint={`${sales.total} orders`}
        />
        <StatCard label="Net, last 30 days" value={formatUSD(total30)} icon="trending" accent="neon" />
        <StatCard
          label="Average order"
          value={formatUSD(sales.total ? Math.round(sales.sumCents / sales.total) : 0)}
          icon="receipt"
          accent="violet"
        />
      </div>

      <div className="glass rounded-2xl p-5">
        <h2 className="text-[15px] font-semibold">Daily net revenue</h2>
        <p className="mb-4 text-[12px] text-mist-500">Last 30 days</p>
        <RevenueChart data={days} />
      </div>

      <div className="glass overflow-x-auto rounded-2xl">
        <table className="w-full min-w-[760px] text-left text-[13px]">
          <thead className="border-b border-white/8 text-[11px] uppercase tracking-wider text-mist-500">
            <tr>
              <th className="px-4 py-3 font-medium">Project</th>
              <th className="px-4 py-3 font-medium">Buyer</th>
              <th className="px-4 py-3 font-medium">Gross</th>
              <th className="px-4 py-3 font-medium">Fee</th>
              <th className="px-4 py-3 font-medium">Your cut</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Tx</th>
            </tr>
          </thead>
          <tbody>
            {sales.items.map((order) => (
              <tr key={order.id} className="border-b border-white/5 transition-colors last:border-0 hover:bg-white/3">
                <td className="px-4 py-3">
                  <Link href={`/p/${order.project.slug}`} className="text-mist-100 hover:text-neon-200">
                    {order.project.title}
                  </Link>
                  <p className="font-mono text-[11px] text-mist-600">{order.reference}</p>
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-2">
                    <Avatar name={order.buyer.displayName} src={order.buyer.avatarUrl} size="xs" />
                    <span className="text-mist-300">@{order.buyer.handle}</span>
                  </span>
                </td>
                <td className="tnum px-4 py-3 text-mist-200">{formatUSD(order.amountCents)}</td>
                <td className="tnum px-4 py-3 text-mist-500">−{formatUSD(order.platformFeeCents)}</td>
                <td className="tnum px-4 py-3 font-medium text-mint">{formatUSD(order.sellerPayoutCents)}</td>
                <td className="px-4 py-3">
                  <Badge size="sm" tone={order.status === "paid" ? "mint" : order.status === "refunded" ? "rose" : "amber"} dot>
                    {order.status}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  {order.txHash ? (
                    <a
                      href={txUrl(order.chain, order.txHash)}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1 font-mono text-[11.5px] text-mist-400 hover:text-neon-200"
                    >
                      {order.txHash.slice(0, 8)}- <ExternalLink className="size-3" />
                    </a>
                  ) : (
                    <span className="text-mist-600">-</span>
                  )}
                </td>
              </tr>
            ))}
            {sales.items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-14 text-center text-[13px] text-mist-500">
                  No sales yet. Publish something and share the link.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {sales.pages > 1 ? (
        <div className="flex items-center justify-between">
          <p className="text-[12px] text-mist-500">
            Page {sales.page} of {sales.pages}
          </p>
          <div className="flex gap-2">
            {sales.page > 1 ? (
              <Link
                href={`/dashboard/sales?page=${sales.page - 1}`}
                className="h-9 rounded-lg border border-white/10 px-3 text-[13px] text-mist-300 hover:text-mist-50"
              >
                Previous
              </Link>
            ) : null}
            {sales.page < sales.pages ? (
              <Link
                href={`/dashboard/sales?page=${sales.page + 1}`}
                className="h-9 rounded-lg border border-white/10 px-3 text-[13px] text-mist-300 hover:text-mist-50"
              >
                Next
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="glass flex items-start gap-3 rounded-2xl p-5">
        <Wallet className="mt-0.5 size-4 shrink-0 text-neon-300" />
        <p className="text-[12.5px] leading-relaxed text-mist-400">
          Payouts land in your linked wallet within seconds of settlement. Set your default address and network in{" "}
          <Link href="/dashboard/settings" className="text-neon-300 hover:text-neon-200">
            settings
          </Link>
          . Last sale {sales.items[0] ? formatDateTime(sales.items[0].createdAt) : "—"}.
        </p>
      </div>
    </div>
  );
}