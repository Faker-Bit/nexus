"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check, Clock, HandCoins, MessageSquare, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn, formatUSD, timeAgo } from "@/lib/utils";

export type OfferRow = {
  id: string;
  amountCents: number;
  currency: string;
  chain: string;
  message: string | null;
  status: string;
  expiresAt: string;
  createdAt: string;
  project: { title: string; slug: string; coverImage: string | null; priceCents: number };
  buyer: { handle: string; displayName: string; avatarUrl: string | null; verified: boolean };
};

const TONE: Record<string, "amber" | "mint" | "neutral" | "rose" | "violet"> = {
  pending: "amber",
  accepted: "mint",
  declined: "rose",
  expired: "neutral",
  withdrawn: "neutral",
  converted: "violet",
};

export function OffersInbox({ offers }: { offers: OfferRow[] }) {
  const router = useRouter();
  const toast = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function respond(id: string, action: "accept" | "decline") {
    setBusyId(id);
    try {
      const res = await fetch(`/api/offers/${id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error?.message ?? "Could not answer that offer.");
      toast.success(
        action === "accept" ? "Offer accepted" : "Offer declined",
        action === "accept" ? "The buyer has 30 minutes to complete payment." : undefined,
      );
      router.refresh();
    } catch (err) {
      toast.error("Could not respond", err instanceof Error ? err.message : undefined);
    } finally {
      setBusyId(null);
    }
  }

  if (!offers.length) {
    return (
      <div className="glass flex flex-col items-center gap-3 rounded-2xl px-6 py-20 text-center">
        <span className="grid size-14 place-items-center rounded-2xl bg-white/4 text-mist-400">
          <HandCoins className="size-6" />
        </span>
        <p className="text-[15px] font-medium">No offers yet</p>
        <p className="max-w-sm text-[13px] text-mist-400">
          Leave offers open on your listings and buyers can negotiate instead of walking away.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {offers.map((offer, i) => {
        const discount = Math.round((1 - offer.amountCents / offer.project.priceCents) * 100);
        const expired = new Date(offer.expiresAt).getTime() < Date.now();
        const actionable = offer.status === "pending" && !expired;

        return (
          <motion.article
            key={offer.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: Math.min(i * 0.04, 0.24) }}
            className="glass rounded-2xl p-4 sm:p-5"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/p/${offer.project.slug}`}
                    className="text-[14.5px] font-medium text-mist-50 transition-colors hover:text-neon-200"
                  >
                    {offer.project.title}
                  </Link>
                  <Badge size="sm" tone={TONE[offer.status] ?? "neutral"} dot>
                    {expired && offer.status === "pending" ? "expired" : offer.status}
                  </Badge>
                  {discount > 0 ? <Badge size="sm" tone="violet">-{discount}%</Badge> : null}
                </div>

                <div className="mt-3 flex flex-wrap items-baseline gap-x-5 gap-y-1">
                  <p className="tnum text-[19px] font-semibold text-mist-50">{formatUSD(offer.amountCents)}</p>
                  <p className="tnum text-[12.5px] text-mist-500 line-through">
                    list {formatUSD(offer.project.priceCents)}
                  </p>
                  <p className="text-[11.5px] text-mist-600">
                    you keep {formatUSD(Math.round(offer.amountCents * 0.92))}
                  </p>
                </div>

                {offer.message ? (
                  <p className="mt-3 flex items-start gap-2 rounded-xl border border-white/8 bg-white/[0.02] p-3 text-[12.5px] leading-relaxed text-mist-300">
                    <MessageSquare className="mt-0.5 size-3.5 shrink-0 text-mist-500" />
                    {offer.message}
                  </p>
                ) : null}

                <p className="mt-2.5 flex items-center gap-1.5 text-[11.5px] text-mist-600">
                  <Clock className="size-3" />
                  {offer.status === "pending" && !expired
                    ? `expires ${timeAgo(offer.expiresAt).replace("ago", "")} from now`
                    : `received ${timeAgo(offer.createdAt)}`}
                </p>
              </div>

              {actionable ? (
                <div className="flex shrink-0 gap-2">
                  <Button
                    variant="danger"
                    loading={busyId === offer.id}
                    onClick={() => respond(offer.id, "decline")}
                    icon={<X className="size-4" />}
                  >
                    Decline
                  </Button>
                  <Button
                    loading={busyId === offer.id}
                    onClick={() => respond(offer.id, "accept")}
                    icon={<Check className="size-4" />}
                    className={cn("min-w-[112px]")}
                  >
                    Accept
                  </Button>
                </div>
              ) : null}
            </div>
          </motion.article>
        );
      })}
    </div>
  );
}