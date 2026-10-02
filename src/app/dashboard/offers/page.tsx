import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { HandCoins } from "lucide-react";
import { prisma } from "@/lib/db";
import { loadUser } from "@/lib/auth";
import { OffersInbox } from "@/components/dashboard/offers-inbox";
import { PageHeader } from "@/components/ui/section";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Offers",
  robots: { index: false, follow: false },
};

export default async function OffersPage() {
  const user = await loadUser();
  if (!user) redirect("/login?next=/dashboard/offers");

  const offers = await prisma.offer.findMany({
    where: { project: { creatorId: user.id } },
    orderBy: { createdAt: "desc" },
    take: 60,
    include: {
      project: { select: { title: true, slug: true, coverImage: true, priceCents: true } },
      buyer: { select: { handle: true, displayName: true, avatarUrl: true, verified: true } },
    },
  });

  const pending = offers.filter((o) => o.status === "pending").length;
  const accepted = offers.filter((o) => o.status === "accepted" || o.status === "converted").length;

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow={
          <>
            <HandCoins className="size-3" /> Negotiations
          </>
        }
        title="Offers"
        description={`${pending} awaiting your answer · ${accepted} accepted. Accepting locks the price and opens checkout for the buyer.`}
      />
      <OffersInbox
        offers={offers.map((offer) => ({
          ...offer,
          expiresAt: offer.expiresAt.toISOString(),
          createdAt: offer.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}