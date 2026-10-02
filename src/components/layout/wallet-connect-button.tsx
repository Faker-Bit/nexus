"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Loader2, Wallet } from "lucide-react";
import { Button, IconButton } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { CHAIN_BY_ID, useWallet, type WalletChainId } from "@/context/wallet-context";
import { cn } from "@/lib/utils";
import { useCopy } from "@/hooks";
import { useToast } from "@/components/ui/toast";

const NETWORKS: WalletChainId[] = [1, 8453, 42161, 137];

export function WalletConnectButton({ className }: { className?: string }) {
  const { wallet, connect, disconnect, switchChain, status, error } = useWallet();
  const [open, setOpen] = useState(false);
  const toast = useToast();
  const { copied, copy } = useCopy();

  return (
    <>
      {wallet ? (
        <div className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            className={cn(
              "group flex h-9 items-center gap-2 rounded-xl border border-white/10 bg-ink-900/60 px-2.5 text-[12.5px] transition-colors hover:border-white/20 hover:bg-ink-800",
              className,
            )}
          >
            <span
              className="size-2 rounded-full"
              style={{
                background: CHAIN_BY_ID[wallet.chainId]?.color ?? "#00ff9d",
                boxShadow: `0 0 10px ${CHAIN_BY_ID[wallet.chainId]?.color ?? "#00ff9d"}`,
              }}
            />
            <span className="font-mono text-mist-200">
              {wallet.address.slice(0, 6)}-{wallet.address.slice(-4)}
            </span>
            <ChevronDown className={cn("size-3 text-mist-500 transition-transform", open && "rotate-180")} />
          </button>

          <AnimatePresence>
            {open ? (
              <>
                <div className="fixed inset-0 z-[80]" onClick={() => setOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                  transition={{ duration: 0.16 }}
                  className="glass-strong absolute right-0 top-full z-[81] mt-2 w-64 rounded-2xl p-2 shadow-lift"
                >
                  <div className="rounded-xl bg-white/4 p-3">
                    <p className="text-[11px] uppercase tracking-wider text-mist-500">Connected</p>
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <span className="font-mono text-[12.5px] text-mist-100">
                        {wallet.address.slice(0, 10)}-{wallet.address.slice(-6)}
                      </span>
                      <button
                        onClick={() => void copy(wallet.address)}
                        className="rounded-md p-1 text-mist-500 transition hover:bg-white/8 hover:text-neon-300"
                        aria-label="Copy address"
                      >
                        {copied ? <Check className="size-3.5 text-mint" /> : <Wallet className="size-3.5" />}
                      </button>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge tone={wallet.isDemo ? "amber" : "mint"} size="sm">
                        {wallet.isDemo ? "Demo wallet" : wallet.label}
                      </Badge>
                    </div>
                  </div>

                  <p className="px-2.5 pb-1 pt-2.5 text-[11px] font-semibold uppercase tracking-wider text-mist-500">
                    Network
                  </p>
                  {NETWORKS.map((id) => (
                    <button
                      key={id}
                      onClick={() => void switchChain(id)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-[13px] transition-colors",
                        wallet.chainId === id ? "bg-neon-400/10 text-neon-100" : "text-mist-300 hover:bg-white/6",
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <span className="size-2 rounded-full" style={{ background: CHAIN_BY_ID[id].color }} />
                        {CHAIN_BY_ID[id].name}
                      </span>
                      {wallet.chainId === id ? <Check className="size-3.5" /> : null}
                    </button>
                  ))}

                  <div className="my-1.5 h-px bg-white/8" />
                  <button
                    onClick={() => {
                      disconnect();
                      setOpen(false);
                      toast.info("Wallet disconnected");
                    }}
                    className="w-full rounded-lg px-2.5 py-2 text-left text-[13px] text-rose-300 transition-colors hover:bg-rose-400/8"
                  >
                    Disconnect
                  </button>
                </motion.div>
              </>
            ) : null}
          </AnimatePresence>
        </div>
      ) : (
        <Button
          variant="glass"
          size="sm"
          loading={status === "connecting"}
          icon={<Wallet className="size-3.5" />}
          onClick={() => setOpen(true)}
          className={className}
        >
          <span className="hidden sm:inline">Connect</span>
        </Button>
      )}

      <Modal
        open={open && !wallet}
        onClose={() => setOpen(false)}
        title="Connect a wallet"
        description="Sign in, buy and get paid. Your keys never leave your wallet."
        size="sm"
      >
        <div className="space-y-3">
          {error ? <p className="rounded-xl border border-rose-400/30 bg-rose-400/8 px-3 py-2 text-[12.5px] text-rose-200">{error}</p> : null}

          <div className="rounded-xl border border-white/10 bg-white/3 p-3.5">
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-lg bg-linear-to-br from-neon-300 to-violet-neon text-void">
                <Wallet className="size-4" />
              </span>
              <div>
                <p className="text-sm font-medium text-mist-50">Browser wallet</p>
                <p className="text-[11.5px] text-mist-500">MetaMask, Rabby, Coinbase Wallet-</p>
              </div>
            </div>
            <Button
              full
              className="mt-3"
              loading={status === "connecting"}
              onClick={async () => {
                const next = await connect();
                if (next) {
                  setOpen(false);
                  toast.success("Wallet connected", `${next.address.slice(0, 8)}- on ${CHAIN_BY_ID[next.chainId].name}`);
                }
              }}
            >
              Connect wallet
            </Button>
          </div>

          <button
            onClick={async () => {
              const next = await connect(8453);
              if (next) {
                setOpen(false);
                toast.success("Demo wallet ready", "No extension needed - explore the full checkout flow.");
              }
            }}
            className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/3 p-3.5 text-left transition-colors hover:border-white/20 hover:bg-white/6"
          >
            <span className="grid size-8 place-items-center rounded-lg bg-amber-400/15 text-amber">
              <Loader2 className="size-4" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-medium text-mist-50">Use the demo wallet</p>
              <p className="text-[11.5px] text-mist-500">Instant, no extension. Simulated settlement.</p>
            </div>
          </button>

          <p className="pt-1 text-center text-[11px] leading-relaxed text-mist-600">
            NEXUS never has access to your funds. Payments are signed in your wallet and verified server-side.
          </p>
        </div>
      </Modal>
    </>
  );
}

export function WalletStatusPill({ className }: { className?: string }) {
  const { wallet } = useWallet();
  if (!wallet) {
    return (
      <span className={cn("inline-flex items-center gap-1.5 rounded-full border border-amber-400/28 bg-amber-400/8 px-2.5 py-1 text-[11px] text-amber-200", className)}>
        <span className="size-1.5 rounded-full bg-amber" />
        Wallet not connected
      </span>
    );
  }
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border border-mint/26 bg-mint/8 px-2.5 py-1 text-[11px] text-mint", className)}>
      <span className="size-1.5 rounded-full bg-mint" />
      {CHAIN_BY_ID[wallet.chainId]?.name} · {wallet.address.slice(0, 6)}-
    </span>
  );
}

export function WalletConnectInline() {
  const { wallet, connect, status } = useWallet();
  if (wallet) return <WalletStatusPill />;
  return (
    <IconButton label="Connect wallet" variant="secondary" size="sm" loading={status === "connecting"} onClick={() => void connect()}>
      <Wallet className="size-4" />
    </IconButton>
  );
}