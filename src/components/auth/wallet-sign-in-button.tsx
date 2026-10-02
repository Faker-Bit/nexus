"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useWallet, CHAIN_ID_BY_KEY, CHAIN_BY_ID } from "@/context/wallet-context";

/**
 * SIWE-style sign-in.
 *
 * 1. POST /api/auth/wallet/nonce  → server issues a nonce and an EIP-4361 message
 * 2. wallet signs the message locally (no gas, no transaction)
 * 3. POST /api/auth/wallet/verify → server recovers the address, verifies the
 *    signature, then issues an httpOnly session cookie
 */
export function WalletSignInButton({
  className,
  variant = "outline",
  label = "Continue with wallet",
}: {
  className?: string;
  variant?: "outline" | "secondary" | "ghost";
  label?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const { wallet, connect, signMessage } = useWallet();
  const [busy, setBusy] = useState(false);

  async function signIn() {
    setBusy(true);
    try {
      const active = wallet ?? (await connect(CHAIN_ID_BY_KEY.base));
      if (!active) return;

      const chainKey = CHAIN_BY_ID[active.chainId]?.key ?? "base";
      const nonceRes = await fetch("/api/auth/wallet/nonce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: active.address, chain: chainKey }),
      });
      const nonceBody = await nonceRes.json();
      if (!nonceRes.ok) throw new Error(nonceBody?.error?.message ?? "Could not start wallet sign-in.");

      const signature = await signMessage(nonceBody.data.message);
      if (!signature) throw new Error("Signature was rejected.");

      const verifyRes = await fetch("/api/auth/wallet/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: active.address, signature, chain: chainKey }),
      });
      const verifyBody = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyBody?.error?.message ?? "Signature could not be verified.");

      toast.success(
        verifyBody.data.created ? "Wallet account created" : "Signed in",
        `@${verifyBody.data.user.handle}`,
      );
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      toast.error("Wallet sign-in failed", err instanceof Error ? err.message : undefined);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      variant={variant}
      full
      size="md"
      loading={busy}
      onClick={signIn}
      icon={<Wallet className="size-4" />}
      className={className}
      type="button"
    >
      {label}
    </Button>
  );
}

export function WalletSignInNote() {
  const { hasInjected } = useWallet();
  return (
    <p className="mt-3 text-center text-[11.5px] leading-relaxed text-mist-600">
      {hasInjected
        ? "Your wallet signs a message only - no transaction, no gas, no approvals."
        : "No browser wallet detected? Use the demo wallet to explore the flow."}
    </p>
  );
}