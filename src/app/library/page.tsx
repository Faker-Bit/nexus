import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ExternalLink, KeyRound, Library as LibraryIcon, ShoppingBag } from "lucide-react";
import { prisma } from "@/lib/db";
import { loadUser } from "@/lib/auth";
import { Container, PageHeader } from "@/components/ui/section";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { DownloadButton } from "@/components/checkout/checkout-client";
import { Avatar } from "@/components/ui/avatar";
import { formatDate, formatUSD } from "@/lib/utils";
import { coverArtFor } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Library",
  description: "Everything you own on NEXUS - downloads, licences and receipts.",
};

export default async function LibraryPage() {
  const user = await loadUser();
  if (!user) redirect("/login?next=/library");

  const orders = await prisma.order.findMany({
    where: { buyerId: user.id, status: "paid" },
    orderBy: { paidAt: "desc" },
    include: {
      project: {
        select: {
          title: true,
          slug: true,
          coverImage: true,
          category: true,
          fileName: true,
          fileSizeBytes: true,
          repoUrl: true,
          docsUrl: true,
          demoUrl: true,
          creator: { select: { handle: true, displayName: true, avatarUrl: true, verified: true } },
        },
      },
      review: { select: { id: true, rating: true } },
    },
  });

  const total = orders.reduce((acc, o) => acc + o.amountCents, 0);

  return (
    <Container className="pb-24">
      <PageHeader
        eyebrow={
          <>
            <LibraryIcon className="size-3" /> Library
          </>
        }
        title="Your library"
        description={`${orders.length} purchase${orders.length === 1 ? "" : "s"} · ${formatUSD(total)} lifetime spend. Downloads are audited, licences are permanent.`}
      >
        <ButtonLink href="/explore" icon={<ShoppingBag className="size-4" />}>
          Find something new
        </ButtonLink>
      </PageHeader>

      {orders.length === 0 ? (
        <div className="glass flex flex-col items-center gap-4 rounded-2xl px-6 py-24 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-white/4 text-mist-400">
            <LibraryIcon className="size-6" />
          </span>
          <p className="text-base font-medium">Nothing here yet</p>
          <p className="max-w-sm text-sm text-mist-400">
            Buy a project and it lands here with its files, licence key and receipt.
          </p>
          <ButtonLink href="/explore" className="mt-1">
            Explore the marketplace
          </ButtonLink>
        </div>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => {
            const art = coverArtFor(order.project.slug);
            return (
              <article key={order.id} className="glass rounded-2xl p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden rounded-xl sm:size-28">
                    {order.project.coverImage ? (
                      <div
                        className="size-full bg-cover bg-center"
                        style={{ backgroundImage: `url(${order.project.coverImage})` }}
                        role="img"
                        aria-label={order.project.title}
                      />
                    ) : (
                      <div className="size-full" style={{ background: art.background }} />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          href={`/p/${order.project.slug}`}
                          className="text-[15px] font-semibold text-mist-50 transition-colors hover:text-neon-200"
                        >
                          {order.project.title}
                        </Link>
                        <p className="mt-1 flex items-center gap-2 text-[12px] text-mist-500">
                          <Avatar name={order.project.creator.displayName} src={order.project.creator.avatarUrl} size="xs" verified={order.project.creator.verified} />
                          @{order.project.creator.handle}
                          <span>·</span>
                          {order.paidAt ? formatDate(order.paidAt) : "-"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="tnum text-[15px] font-semibold text-mist-50">{formatUSD(order.amountCents)}</p>
                        <p className="text-[11px] text-mist-500">{order.currency}</p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge tone="neon" size="sm">
                        <KeyRound className="size-3" />
                        {order.licenseType}
                      </Badge>
                      <Badge tone="mint" size="sm">
                        {order.reference}
                      </Badge>
                      {!order.review ? (
                        <Badge tone="amber" size="sm">
                          Review pending
                        </Badge>
                      ) : null}
                      <Badge tone="neutral" size="sm">
                        {order.downloadCount} download{order.downloadCount === 1 ? "" : "s"}
                      </Badge>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <DownloadButton orderId={order.id} />
                      {order.licenseKey ? (
                        <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 font-mono text-[12px] text-mist-300">
                          {order.licenseKey}
                        </span>
                      ) : null}
                      {order.project.repoUrl ? (
                        <a
                          href={order.project.repoUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-white/12 px-3 text-[12.5px] text-mist-200 transition-colors hover:border-white/25 hover:text-white"
                        >
                          Source <ExternalLink className="size-3" />
                        </a>
                      ) : null}
                      {order.project.docsUrl ? (
                        <a
                          href={order.project.docsUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-white/12 px-3 text-[12.5px] text-mist-200 transition-colors hover:border-white/25 hover:text-white"
                        >
                          Docs <ExternalLink className="size-3" />
                        </a>
                      ) : null}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </Container>
  );
}
