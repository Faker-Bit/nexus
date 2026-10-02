import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowDownLeft, ArrowUpRight, ExternalLink, Receipt } from "lucide-react";
import { prisma } from "@/lib/db";
import { loadUser } from "@/lib/auth";
import { Container, PageHeader } from "@/components/ui/section";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { formatDateTime, formatUSD, txUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Transactions",
  description: "Your on-chain transaction history on NEXUS … purchases, sales, fees and refunds.",
};

type SearchParams = Promise<{ scope?: string }>;

export default async function TransactionsPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await loadUser();
  if (!user) redirect("/login?next=/transactions");

  const { scope = "all" } = await searchParams;

  const where =
    scope === "purchases"
      ? { userId: user.id, type: "purchase" }
      : scope === "sales"
        ? { userId: user.id, type: "sale" }
        : { userId: user.id };

  const [items, totals] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        order: {
          select: {
            reference: true,
            status: true,
            project: { select: { title: true, slug: true } },
            buyer: { select: { handle: true } },
            seller: { select: { handle: true } },
          },
        },
      },
    }),
    prisma.transaction.groupBy({
      by: ["direction"],
      where: { userId: user.id, status: "confirmed" },
      _sum: { amountCents: true },
    }),
  ]);

  const incoming = totals.find((t) => t.direction === "in")?._sum.amountCents ?? 0;
  const outgoing = totals.find((t) => t.direction === "out")?._sum.amountCents ?? 0;

  return (
    <Container className="pb-24">
      <PageHeader
        eyebrow={
          <>
            <Receipt className="size-3" /> Ledger
          </>
        }
        title="Transactions"
        description="Every purchase, sale and fee - with the hash you can verify on any block explorer."
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {[
          { key: "all", label: "All" },
          { key: "purchases", label: "Purchases" },
          { key: "sales", label: "Sales" },
        ].map((tab) => (
          <Link
            key={tab.key}
            href={tab.key === "all" ? "/transactions" : `/transactions?scope=${tab.key}`}
            className={`h-9 rounded-lg border px-3.5 text-[13px] font-medium transition-all ${
              scope === tab.key
                ? "border-neon-400/45 bg-neon-400/10 text-neon-100"
                : "border-white/10 text-mist-400 hover:border-white/20 hover:text-mist-100"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="mb-8 grid gap-px overflow-hidden rounded-2xl border border-white/8 bg-white/6 sm:grid-cols-3">
        <div className="bg-ink-950/70 px-5 py-4">
          <p className="text-[11px] uppercase tracking-wider text-mist-500">Incoming</p>
          <p className="tnum mt-1 flex items-center gap-1.5 text-[19px] font-semibold text-mint">
            <ArrowDownLeft className="size-4" />
            {formatUSD(incoming)}
          </p>
        </div>
        <div className="bg-ink-950/70 px-5 py-4">
          <p className="text-[11px] uppercase tracking-wider text-mist-500">Outgoing</p>
          <p className="tnum mt-1 flex items-center gap-1.5 text-[19px] font-semibold text-mist-100">
            <ArrowUpRight className="size-4" />
            {formatUSD(outgoing)}
          </p>
        </div>
        <div className="bg-ink-950/70 px-5 py-4">
          <p className="text-[11px] uppercase tracking-wider text-mist-500">Net</p>
          <p className="tnum mt-1 text-[19px] font-semibold text-mist-50">{formatUSD(incoming - outgoing)}</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="glass rounded-2xl px-6 py-20 text-center">
          <p className="text-base font-medium">No transactions yet</p>
          <p className="mt-1 text-sm text-mist-400">Your ledger fills up as soon as you buy or sell something.</p>
          <ButtonLink href="/explore" className="mt-5">
            Explore projects
          </ButtonLink>
        </div>
      ) : (
        <div className="glass overflow-x-auto rounded-2xl">
          <table className="w-full min-w-[720px] text-left text-[13px]">
            <thead className="border-b border-white/8 text-[11px] uppercase tracking-wider text-mist-500">
              <tr>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Project</th>
                <th className="px-4 py-3 font-medium">Counterparty</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Tx</th>
              </tr>
            </thead>
            <tbody>
              {items.map((tx) => (
                <tr key={tx.id} className="border-b border-white/5 transition-colors last:border-0 hover:bg-white/3">
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 capitalize ${
                        tx.direction === "in" ? "text-mint" : "text-mist-200"
                      }`}
                    >
                      {tx.direction === "in" ? <ArrowDownLeft className="size-3.5" /> : <ArrowUpRight className="size-3.5" />}
                      {tx.type.replace("_", " ")}
                    </span>
                  </td>
                  <td className="max-w-[220px] truncate px-4 py-3">
                    {tx.order?.project ? (
                      <Link href={`/p/${tx.order.project.slug}`} className="text-mist-100 hover:text-neon-200">
                        {tx.order.project.title}
                      </Link>
                    ) : (
                      <span className="text-mist-500">…</span>
                    )}
                    {tx.order ? <span className="ml-1.5 font-mono text-[11px] text-mist-600">{tx.order.reference}</span> : null}
                  </td>
                  <td className="px-4 py-3 text-mist-400">
                    {tx.order
                      ? tx.direction === "out"
                        ? `@${tx.order.seller.handle}`
                        : `@${tx.order.buyer.handle}`
                      : "…"}
                  </td>
                  <td className="tnum px-4 py-3">
                    <span className={tx.direction === "in" ? "text-mint" : "text-mist-100"}>
                      {tx.direction === "in" ? "+" : "−"}
                      {formatUSD(tx.amountCents)}
                    </span>{" "}
                    <span className="text-[11px] text-mist-500">{tx.currency}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      size="sm"
                      tone={tx.status === "confirmed" ? "mint" : tx.status === "failed" ? "rose" : "amber"}
                      dot
                    >
                      {tx.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-mist-500">{formatDateTime(tx.createdAt)}</td>
                  <td className="px-4 py-3">
                    {tx.txHash ? (
                      <a
                        href={txUrl(tx.chain, tx.txHash)}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1 font-mono text-[11.5px] text-mist-400 hover:text-neon-200"
                      >
                        {tx.txHash.slice(0, 10)}…
                        <ExternalLink className="size-3" />
                      </a>
                    ) : (
                      <span className="text-mist-600">…</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Container>
  );
}