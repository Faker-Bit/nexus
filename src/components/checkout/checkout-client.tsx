"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  Copy,
  ExternalLink,
  FileArchive,
  KeyRound,
  Loader2,
  Lock,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { AlertBanner, useToast } from "@/components/ui/toast";
import { useWallet, CHAIN_BY_ID, CHAIN_ID_BY_KEY } from "@/context/wallet-context";
import { cn, coverArtFor, formatUSD, shortAddress, txUrl } from "@/lib/utils";
import { CHAINS } from "@/lib/constants";
import { SceneZone } from "@/components/three/webgl-zone";

type Phase = "review" | "signing" | "confirming" | "success" | "failed";

type OrderPayload = {
  order: {
    id: string;
    reference: string;
    status: string;
    amountCents: number;
    platformFeeCents: number;
    sellerPayoutCents: number;
    currency: string;
    chain: string;
    memecoin: boolean;
    licenseType: string;
    txHash: string | null;
    licenseKey: string | null;
    createdAt: string;
    project: {
      title: string;
      slug: string;
      tagline: string;
      coverImage: string | null;
      fileName: string | null;
      fileSizeBytes: number | null;
      downloadCount: number;
    };
    seller: { handle: string; displayName: string; avatarUrl: string | null; verified: boolean };
  };
};

export function CheckoutClient({ orderId }: { orderId: string }) {
  const router = useRouter();
  const toast = useToast();
  const { wallet, connect, signMessage, switchChain } = useWallet();

  const [data, setData] = useState<OrderPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("review");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/checkout/${orderId}`, { cache: "no-store" });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error?.message ?? "Could not load this order.");
      setData(body.data);
      if (body.data.order.status === "paid") setPhase("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function pay() {
    if (!data) return;
    try {
      if (!wallet) {
        const next = await connect();
        if (!next) throw new Error("Connect a wallet to pay.");
      } else if (data.order.chain && CHAIN_BY_ID[wallet.chainId]?.key !== data.order.chain) {
        const target = CHAIN_ID_BY_KEY[data.order.chain];
        if (target) await switchChain(target);
      }

      setPhase("signing");
      // The buyer authorises the transfer in their wallet (signature or tx,
      // depending on the provider). The demo provider settles instantly.
      await signMessage(
        `NEXUS checkout ${data.order.reference} - ${data.order.amountCents / 100} ${data.order.currency}`,
      );

      setPhase("confirming");
      const res = await fetch(`/api/checkout/${orderId}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error?.message ?? "Settlement failed.");

      setTxHash(body.data.order.txHash);
      setPhase("success");
      toast.success("Payment settled", "Your files are unlocked.");
      await load();
      router.refresh();
    } catch (err) {
      setPhase("failed");
      toast.error("Payment did not go through", err instanceof Error ? err.message : undefined);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto grid max-w-5xl place-items-center py-32">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-6 animate-spin text-neon-400" />
          <p className="text-[13px] text-mist-400">Loading your order-</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-lg py-28">
        <AlertBanner tone="danger" title="Order unavailable">
          {error ?? "We could not find that order."}
        </AlertBanner>
        <ButtonLink href="/explore" className="mt-5" variant="secondary" full>
          Back to explore
        </ButtonLink>
      </div>
    );
  }

  const { order } = data;
  const art = coverArtFor(order.project.slug);
  const paid = order.status === "paid";

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:py-14">
      <Link
        href={`/p/${order.project.slug}`}
        className="inline-flex items-center gap-1.5 text-[12.5px] text-mist-500 transition-colors hover:text-mist-200"
      >
        <ArrowLeft className="size-3.5" />
        Back to {order.project.title}
      </Link>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* left: the flow */}
        <div>
          <h1 className="text-[clamp(1.7rem,4vw,2.5rem)] font-semibold leading-tight">
            {paid ? "Payment settled" : "Complete your purchase"}
          </h1>
          <p className="mt-2 text-[14px] text-mist-400">
            Order <span className="font-mono text-mist-200">{order.reference}</span> ·{" "}
            {new Date(order.createdAt).toLocaleString()}
          </p>

          <ol className="mt-8 space-y-3">
            {[
              { label: "Order created", done: true, active: false },
              { label: "Payment authorised in your wallet", done: paid || phase === "confirming", active: phase === "signing" },
              { label: "Settlement confirmed on-chain", done: paid, active: phase === "confirming" },
              { label: "Files unlocked", done: paid, active: false },
            ].map((step, i) => (
              <li key={step.label}>
                <div
                  className={cn(
                    "flex items-center gap-3 rounded-xl border p-3.5 transition-all",
                    step.done
                      ? "border-mint/25 bg-mint/6"
                      : step.active
                        ? "border-neon-400/35 bg-neon-400/6"
                        : "border-white/8 bg-white/[0.02]",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold",
                      step.done
                        ? "bg-mint text-void"
                        : step.active
                          ? "bg-neon-400 text-void"
                          : "bg-white/8 text-mist-500",
                    )}
                  >
                    {step.done ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
                  </span>
                  <span className={cn("text-[13.5px]", step.done ? "text-mist-100" : "text-mist-400")}>{step.label}</span>
                  {step.active ? <Loader2 className="ml-auto size-3.5 animate-spin text-neon-400" /> : null}
                </div>
              </li>
            ))}
          </ol>

          {phase === "failed" ? (
            <AlertBanner tone="danger" title="Payment failed" className="mt-6">
              Nothing was charged. You can retry - the order stays open for 30 minutes.
              <div className="mt-2">
                <Button size="xs" variant="secondary" onClick={() => setPhase("review")}>
                  Try again
                </Button>
              </div>
            </AlertBanner>
          ) : null}

          {paid ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative mt-8 space-y-5"
            >
              <SceneZone
                scene="burst"
                settings={{ distance: 9, fov: 50, bloom: 1, count: 1100 }}
                tone="lime"
                margin="80px"
                className="pointer-events-none absolute -inset-x-10 -top-24 -z-10 h-[420px] opacity-90"
              />
              <div className="glass rounded-2xl p-5">
                <div className="flex items-center gap-2.5 text-mint">
                  <Check className="size-4" />
                  <p className="text-sm font-medium">Files are unlocked</p>
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-mist-400">
                  Download the archive now. Your licence and receipt stay in your library forever, even if the
                  listing is archived.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <DownloadButton orderId={order.id} />
                  <ButtonLink href="/library" variant="secondary">
                    Open library
                  </ButtonLink>
                </div>
              </div>

              {order.licenseKey ? (
                <div className="glass rounded-2xl p-5">
                  <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-mist-500">
                    <KeyRound className="size-3.5" /> Licence key
                  </p>
                  <div className="mt-2.5 flex items-center justify-between gap-3">
                    <code className="font-mono text-[14px] text-neon-100">{order.licenseKey}</code>
                    <button
                      onClick={() => {
                        void navigator.clipboard.writeText(order.licenseKey!);
                        setCopied("licence");
                        setTimeout(() => setCopied(null), 1600);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1 text-[11.5px] text-mist-400 hover:text-mist-100"
                    >
                      {copied === "licence" ? <Check className="size-3 text-mint" /> : <Copy className="size-3" />}
                      {copied === "licence" ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>
              ) : null}

              {(txHash ?? order.txHash) ? (
                <div className="glass rounded-2xl p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-mist-500">Transaction</p>
                  <div className="mt-2.5 flex items-center justify-between gap-3">
                    <code className="truncate font-mono text-[12px] text-mist-300">
                      {txHash ?? order.txHash}
                    </code>
                    <a
                      href={txUrl(order.chain, (txHash ?? order.txHash)!)}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1 text-[11.5px] text-mist-400 hover:text-mist-100"
                    >
                      Explorer <ExternalLink className="size-3" />
                    </a>
                  </div>
                </div>
              ) : null}
            </motion.div>
          ) : null}
        </div>

        {/* right: summary */}
        <aside className="space-y-4">
          <div className="glass rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <div className="relative size-14 shrink-0 overflow-hidden rounded-xl">
                {order.project.coverImage ? (
                  <Image src={order.project.coverImage} alt="" fill sizes="56px" className="object-cover" />
                ) : (
                  <div className="size-full" style={{ background: art.background }} />
                )}
              </div>
              <div className="min-w-0">
                <Link
                  href={`/p/${order.project.slug}`}
                  className="text-[14px] font-medium text-mist-50 transition-colors hover:text-neon-200"
                >
                  {order.project.title}
                </Link>
                <p className="mt-0.5 line-clamp-2 text-[12px] leading-relaxed text-mist-500">{order.project.tagline}</p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 border-y border-white/8 py-3">
              <span className="text-[12px] text-mist-500">Sold by</span>
              <Link href={`/c/${order.seller.handle}`} className="text-[12.5px] text-mist-100 hover:text-neon-200">
                {order.seller.displayName}
              </Link>
              {order.seller.verified ? <BadgeCheck className="size-3.5 text-neon-300" /> : null}
            </div>

            <dl className="mt-4 space-y-2.5 text-[13px]">
              <div className="flex items-center justify-between">
                <dt className="text-mist-500">Licence</dt>
                <dd className="capitalize text-mist-100">{order.licenseType}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-mist-500">Network</dt>
                <dd className="text-mist-100">{CHAINS.find((c) => c.key === order.chain)?.label ?? order.chain}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-mist-500">Settles in</dt>
                <dd className={cn("text-mist-100", order.memecoin && "text-amber")}>{order.currency}</dd>
              </div>
              <div className="flex items-center justify-between border-t border-white/8 pt-2.5">
                <dt className="text-mist-300">Total</dt>
                <dd className="tnum text-[17px] font-semibold text-mist-50">
                  {formatUSD(order.amountCents, { precise: true })} {order.currency}
                </dd>
              </div>
            </dl>

            {!paid ? (
              <Button full size="lg" className="mt-5" onClick={pay} loading={phase === "signing" || phase === "confirming"}>
                {phase === "signing" ? "Confirm in wallet-" : phase === "confirming" ? "Awaiting confirmation-" : "Pay now"}
              </Button>
            ) : null}

            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-white/8 bg-white/3 p-3">
              <Lock className="mt-0.5 size-3.5 shrink-0 text-neon-300" />
              <p className="text-[11.5px] leading-relaxed text-mist-400">
                NEXUS never holds your funds. The transfer is signed by your wallet and confirmed by the chain
                before any file is unlocked.
              </p>
            </div>
          </div>

          {wallet ? (
            <div className="glass rounded-2xl p-4">
              <p className="flex items-center gap-2 text-[12px] text-mist-400">
                <Wallet className="size-3.5 text-mint" />
                Paying from <span className="font-mono text-mist-100">{shortAddress(wallet.address, 8, 6)}</span>
              </p>
              <p className="mt-1 text-[11px] text-mist-600">
                {wallet.isDemo ? "Demo wallet - settlement is simulated in development." : CHAIN_BY_ID[wallet.chainId]?.name}
              </p>
            </div>
          ) : (
            <Button variant="secondary" full onClick={() => void connect()}>
              Connect a different wallet
            </Button>
          )}

          <div className="glass rounded-2xl p-4">
            <p className="flex items-center gap-2 text-[12px] font-medium text-mist-200">
              <ShieldCheck className="size-3.5 text-mint" />
              Buyer protection
            </p>
            <ul className="mt-2.5 space-y-1.5 text-[11.5px] leading-relaxed text-mist-500">
              <li>· Funds settle before files unlock</li>
              <li>· Signed download receipt on every fetch</li>
              <li>· 30-day refund if delivered files stop working</li>
              <li>· Disputes escalated by a human, not a bot</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

export function DownloadButton({ orderId }: { orderId: string }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function download() {
    setBusy(true);
    try {
      const res = await fetch(`/api/checkout/${orderId}/download`, { cache: "no-store" });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error?.message ?? "Download failed.");

      const { url, fileName } = body.data.download as { url: string; fileName: string };
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success("Download started", fileName);
    } catch (err) {
      toast.error("Download failed", err instanceof Error ? err.message : undefined);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button onClick={download} loading={busy} icon={<FileArchive className="size-4" />}>
      Download files
    </Button>
  );
}
