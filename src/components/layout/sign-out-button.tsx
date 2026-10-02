"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

export function SignOutButton({
  className,
  children,
  onDone,
}: {
  className?: string;
  children?: React.ReactNode;
  onDone?: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = React.useState(false);

  async function signOut() {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("Signed out");
      onDone?.();
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Could not sign out", "Check your connection and retry.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={signOut}
      disabled={busy}
      className={cn("inline-flex h-10 items-center justify-center gap-2 px-2 text-sm transition-colors disabled:opacity-50", className)}
    >
      {busy ? <Loader2 className="size-4 animate-spin" /> : children}
    </button>
  );
}