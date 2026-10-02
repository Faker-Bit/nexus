"use client";

import { useState } from "react";
import { ReviewComposer, ReviewSummary, type ReviewRow } from "./reviews";

/** Owns the "write review" modal so the server component stays stateless. */
export function ReviewSection({
  avg,
  count,
  buckets,
  reviews,
  reviewableOrderId,
  projectTitle,
}: {
  avg: number;
  count: number;
  buckets: Array<{ rating: number; count: number }>;
  reviews: ReviewRow[];
  reviewableOrderId: string | null;
  projectTitle: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <ReviewSummary
        avg={avg}
        count={count}
        buckets={buckets}
        reviews={reviews}
        canReview={Boolean(reviewableOrderId)}
        onWriteReview={() => setOpen(true)}
      />
      <ReviewComposer
        open={open}
        onClose={() => setOpen(false)}
        orderId={reviewableOrderId}
        projectTitle={projectTitle}
      />
    </>
  );
}