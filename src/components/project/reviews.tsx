"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ThumbsUp } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Stars, StarPicker, RatingBreakdown } from "@/components/ui/rating";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { AlertBanner, useToast } from "@/components/ui/toast";
import { timeAgo } from "@/lib/utils";

export type ReviewRow = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  helpful: number;
  createdAt: string | Date;
  sellerReply: string | null;
  author: {
    id: string;
    handle: string;
    displayName: string;
    avatarUrl: string | null;
    verified: boolean;
  };
  project?: { slug: string; title: string };
};

export function ReviewSummary({
  avg,
  count,
  buckets,
  reviews,
  canReview,
  onWriteReview,
}: {
  avg: number;
  count: number;
  buckets: Array<{ rating: number; count: number }>;
  reviews: ReviewRow[];
  canReview?: boolean;
  onWriteReview?: () => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? reviews : reviews.slice(0, 4);

  return (
    <div className="space-y-7">
      <div className="glass rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <RatingBreakdown avg={avg} count={count} buckets={buckets} />
          <div className="shrink-0">
            {canReview ? (
              <Button variant="secondary" onClick={onWriteReview}>
                Write a review
              </Button>
            ) : count > 0 ? (
              <p className="max-w-[180px] text-[12px] leading-relaxed text-mist-500">
                Reviews unlock after a completed purchase on this listing.
              </p>
            ) : (
              <p className="max-w-[190px] text-[12px] leading-relaxed text-mist-500">
                No reviews yet. Be the first to report back after buying.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {visible.map((review) => (
          <article key={review.id} className="glass rounded-2xl p-5">
            <header className="flex items-start gap-3">
              <Avatar name={review.author.displayName} src={review.author.avatarUrl} verified={review.author.verified} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/c/${review.author.handle}`}
                    className="text-[13.5px] font-medium text-mist-50 transition-colors hover:text-neon-200"
                  >
                    {review.author.displayName}
                  </Link>
                  <Badge tone="mint" size="sm">
                    Verified purchase
                  </Badge>
                  <span className="text-[11.5px] text-mist-600">{timeAgo(review.createdAt)}</span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <Stars value={review.rating} size="xs" />
                  {review.title ? <span className="text-[13px] font-medium text-mist-100">{review.title}</span> : null}
                </div>
              </div>
            </header>

            <p className="mt-3 text-[13.5px] leading-relaxed text-mist-300">{review.body}</p>

            {review.sellerReply ? (
              <div className="mt-3 rounded-xl border border-white/8 bg-white/3 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-mist-500">Creator reply</p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-mist-300">{review.sellerReply}</p>
              </div>
            ) : null}

            <div className="mt-3 flex items-center gap-3">
              <button className="flex items-center gap-1.5 text-[11.5px] text-mist-500 transition-colors hover:text-mist-200">
                <ThumbsUp className="size-3.5" />
                Helpful{review.helpful ? ` (${review.helpful})` : ""}
              </button>
              {review.project ? (
                <Link
                  href={`/p/${review.project.slug}`}
                  className="truncate text-[11.5px] text-mist-500 transition-colors hover:text-mist-200"
                >
                  on {review.project.title}
                </Link>
              ) : null}
            </div>
          </article>
        ))}

        {reviews.length > 4 ? (
          <Button variant="outline" full onClick={() => setShowAll((v) => !v)}>
            {showAll ? "Show fewer" : `Show all ${reviews.length} reviews`}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function ReviewComposer({
  open,
  onClose,
  orderId,
  projectTitle,
}: {
  open: boolean;
  onClose: () => void;
  orderId: string | null;
  projectTitle: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!orderId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, rating, title: title.trim() || null, body: body.trim() }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error?.message ?? "Could not publish the review.");
      toast.success("Review published", "Thanks - it helps other buyers.");
      onClose();
      setBody("");
      setTitle("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Review this purchase"
      description={projectTitle}
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={busy} disabled={body.trim().length < 20}>
            Publish review
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {error ? <AlertBanner tone="danger" title="Not published">{error}</AlertBanner> : null}

        <Field label="Rating">
          <StarPicker value={rating} onChange={setRating} />
        </Field>

        <Field label="Headline" hint="Optional - summarise in a few words.">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
            placeholder="Exactly as described"
            className="h-11 w-full rounded-xl border border-white/10 bg-ink-900/70 px-3.5 text-sm outline-none transition-colors focus:border-neon-400/50"
          />
        </Field>

        <Field
          label="Your review"
          required
          hint={`${body.trim().length}/20 minimum. What worked, what did not, would you use it again?`}
        >
          <Textarea rows={5} value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} />
        </Field>
      </div>
    </Modal>
  );
}