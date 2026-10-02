"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export function EnableCreatorButton() {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function enable() {
    setBusy(true);
    try {
      const res = await fetch("/api/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCreator: true }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error?.message ?? "Could not enable creator mode.");
      toast.success("Creator mode enabled", "You can publish your first project now.");
      router.refresh();
    } catch (err) {
      toast.error("Could not enable creator mode", err instanceof Error ? err.message : undefined);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button size="lg" loading={busy} onClick={enable} icon={<Store className="size-4" />}>
      Enable creator mode
    </Button>
  );
}