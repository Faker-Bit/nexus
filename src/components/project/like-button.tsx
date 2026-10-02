"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

export function LikeButton({
  projectId,
  initialLiked,
  initialCount,
  className,
  size = "md",
  stopPropagation = true,
}: {
  projectId: string;
  initialLiked: boolean;
  initialCount: number;
  className?: string;
  size?: "sm" | "md" | "lg";
  stopPropagation?: boolean;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [busy, startTransition] = useTransition();
  const toast = useToast();

  async function toggle(event: React.MouseEvent) {
    if (stopPropagation) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (busy) return;

    const next = !liked;
    setLiked(next);
    setCount((c) => c + (next ? 1 : -1));

    startTransition(async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/like`, {
          method: liked ? "DELETE" : "POST",
        });
        if (!res.ok) throw new Error();
        const body = await res.json();
        if (typeof body?.data?.likeCount === "number") setCount(body.data.likeCount);
        if (typeof body?.data?.liked === "boolean") setLiked(body.data.liked);
      } catch {
        setLiked(!next);
        setCount((c) => c - (next ? 1 : -1));
        toast.error("Could not update", "Sign in to save projects to your library.");
      }
    });
  }

  const px = { sm: "size-3", md: "size-3.5", lg: "size-4" }[size];

  return (
    <button
      onClick={toggle}
      aria-pressed={liked}
      aria-label={liked ? "Remove from library" : "Save to library"}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg transition-all duration-200 active:scale-90",
        liked ? "text-rose-300" : "text-mist-400 hover:text-rose-300",
        className,
      )}
    >
      <Heart className={cn(px, "transition-transform", liked && "scale-110 fill-current")} />
      {initialCount > 0 || liked ? (
        <span className="tnum text-[11.5px]">{count}</span>
      ) : null}
    </button>
  );
}