"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellRing, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { formatCompact } from "@/lib/utils";

export function FollowButton({
  handle,
  initialFollowing,
  followerCount,
}: {
  handle: string;
  initialFollowing: boolean;
  followerCount: number;
}) {
  const router = useRouter();
  const toast = useToast();
  const [following, setFollowing] = useState(initialFollowing);
  const [count, setCount] = useState(followerCount);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    const next = !following;
    setFollowing(next);
    setCount((c) => c + (next ? 1 : -1));
    try {
      const res = await fetch(`/api/creators/${handle}/follow`, { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error?.message ?? "Could not update");
      setFollowing(body.data.following);
      setCount(body.data.followerCount);
      if (body.data.following) toast.success("Following", `You will see updates from @${handle}.`);
      router.refresh();
    } catch (err) {
      setFollowing(!next);
      setCount((c) => c - (next ? 1 : -1));
      toast.error(
        "Could not follow",
        err instanceof Error ? err.message : "Sign in to follow creators.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      variant={following ? "secondary" : "primary"}
      size="sm"
      loading={busy}
      onClick={toggle}
      icon={following ? <Check className="size-3.5" /> : <Bell className="size-3.5" />}
    >
      {following ? "Following" : "Follow"}
      {count > 0 ? <span className="tnum ml-1 opacity-70">{formatCompact(count)}</span> : null}
      {following ? <BellRing className="ml-1.5 size-3.5 opacity-60" /> : null}
    </Button>
  );
}