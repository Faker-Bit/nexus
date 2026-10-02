"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Check,
  Copy,
  Download,
  FileArchive,
  FileText,
  GitBranch,
  Globe2,
  Handshake,
  Lock,
  MessageSquare,
  Repeat,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Stars } from "@/components/ui/rating";
import { Modal } from "@/components/ui/modal";
import { Field, NumberStepper, Textarea } from "@/components/ui/input";
import { AlertBanner, useToast } from "@/components/ui/toast";
import { cn, formatUSD } from "@/lib/utils";
import { CHAINS, LICENSE_TIERS, MEMECOINS, TOKENS } from "@/lib/constants";
import { useWallet } from "@/context/wallet-context";

export type BuyableProject = {
  id: string;
  slug: string;
  title: string;
  priceCents: number;
  currency: string;
  chain: string;
  acceptsOffers: boolean;
  acceptsMeme: boolean;
  memeToken: string | null;
  saleCount: number;
  ratingCount: number;
  creator: { handle: string; displayName: string };
};

const FEE_LABEL = "8% platform fee";

export function BuyBox({ project, owned }: { project: BuyableProject; owned: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const { wallet, connect } = useWallet();
  const [license, setLicense] = useState<"standard" | "extended" | "source">("standard");
  const [currency, setCurrency] = useState(project.currency === "ETH" ? "ETH" : "USDC");
  const [chain, setChain] = useState(project.chain);
  const [memecoin, setMemecoin] = useState<string | null>(null);
  const [offerOpen, setOfferOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const tier = LICENSE_TIERS.find((t) => t.key === license) ?? LICENSE_TIERS[0];
  const free = project.priceCents === 0;
  const gross = free ? 0 : Math.round(project.priceCents * tier.multiplier);
  const isMeme = Boolean(memecoin);
  const settledToken = memecoin ?? currency;

  if (owned) {
    return (
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 text-mint">
          <Check className="size-4" />
          <p className="text-sm font-medium">You own this</p>
        </div>
        <p className="mt-2 text-[12.5px] leading-relaxed text-mist-400">
          Downloads, your license key and receipts live in your library.
        </p>
        <Button full className="mt-4" onClick={() => router.push("/library")} icon={<Download className="size-4" />}>
          Open in library
        </Button>
      </div>
    );
  }

  async function checkout() {
    setBusy(true);
    try {
      if (!wallet) {
        const next = await connect();
        if (!next) {
          toast.error("Wallet required", "Connect a wallet to complete the purchase.");
          return;
        }
      }
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          licenseType: license,
          currency,
          chain,
          memecoin: memecoin ?? null,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error?.message ?? "Checkout failed");
      router.push(`/checkout/${body.data.order.id}`);
    } catch (err) {
      toast.error("Could not start checkout", err instanceof Error ? err.message : undefined);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="glass relative overflow-hidden rounded-2xl p-5">
      <div className="pointer-events-none absolute inset-x-0 -top-20 h-32 bg-[radial-gradient(60%_100%_at_50%_100%,rgba(45,226,255,0.16),transparent_70%)]" />

      <div className="relative">
        {project.priceCents === 0 ? (
          <div>
            <p className="font-display text-3xl font-semibold text-mint">Free</p>
            <p className="mt-1 text-[12.5px] text-mist-400">Open licence - take it and ship.</p>
          </div>
        ) : (
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="font-display text-3xl font-semibold text-mist-50">
                {formatUSD(gross, { precise: true })}
              </p>
              <p className="mt-0.5 text-[12px] text-mist-500">
                {tier.label} licence · {settledToken} on {CHAINS.find((c) => c.key === chain)?.label ?? chain}
              </p>
            </div>
            {tier.multiplier > 1 ? (
              <Badge tone="violet">{Math.round((tier.multiplier - 1) * 100)}% uplift</Badge>
            ) : null}
          </div>
        )}

        {/* license tiers */}
        {!free ? (
          <div className="mt-4 space-y-1.5">
            {LICENSE_TIERS.map((t) => (
              <button
                key={t.key}
                onClick={() => setLicense(t.key)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition-all",
                  license === t.key
                    ? "border-neon-400/45 bg-neon-400/8"
                    : "border-white/8 hover:border-white/16 hover:bg-white/3",
                )}
              >
                <span className="min-w-0">
                  <span className={cn("block text-[13px] font-medium", license === t.key ? "text-neon-100" : "text-mist-100")}>
                    {t.label}
                  </span>
                  <span className="block truncate text-[11px] text-mist-500">{t.blurb}</span>
                </span>
                <span className="tnum shrink-0 text-[12.5px] text-mist-300">{formatUSD(Math.round(project.priceCents * t.multiplier))}</span>
              </button>
            ))}
          </div>
        ) : null}

        {/* settlement */}
        {!free ? (
          <div className="mt-4 space-y-3">
            <div>
              <p className="mb-1.5 text-[11px] uppercase tracking-wider text-mist-500">Settle with</p>
              <div className="flex flex-wrap gap-1.5">
                {TOKENS.map((token) => (
                  <button
                    key={token.symbol}
                    onClick={() => {
                      setCurrency(token.symbol);
                      setMemecoin(null);
                    }}
                    className={cn(
                      "rounded-lg border px-2.5 py-1.5 text-[12px] font-medium transition-all",
                      !memecoin && currency === token.symbol
                        ? "border-neon-400/45 bg-neon-400/10 text-neon-100"
                        : "border-white/8 text-mist-400 hover:border-white/20",
                    )}
                  >
                    {token.symbol}
                  </button>
                ))}
                {project.acceptsMeme
                  ? MEMECOINS.map((meme) => (
                      <button
                        key={meme.symbol}
                        onClick={() => setMemecoin(memecoin === meme.symbol ? null : meme.symbol)}
                        className={cn(
                          "flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[12px] font-medium transition-all",
                          memecoin === meme.symbol
                            ? "border-amber-300/50 bg-amber-300/12 text-amber"
                            : "border-amber-300/22 text-amber-200/80 hover:border-amber-300/40",
                        )}
                        title={`Creator accepts ${meme.name} rails`}
                      >
                        <Zap className="size-3" />
                        {meme.symbol}
                      </button>
                    ))
                  : null}
              </div>
              {isMeme ? (
                <p className="mt-1.5 text-[11px] text-amber-200/80">
                  Paying with {memecoin} - volatile rails, instant delivery. Settles at your wallet.
                </p>
              ) : null}
            </div>

            <Field label="Network">
              <div className="flex flex-wrap gap-1.5">
                {CHAINS.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => setChain(c.key)}
                    className={cn(
                      "rounded-lg border px-2.5 py-1.5 text-[12px] transition-all",
                      chain === c.key
                        ? "border-white/25 bg-white/8 text-mist-50"
                        : "border-white/8 text-mist-400 hover:border-white/20",
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        ) : null}

        <Button full size="lg" className="mt-5" loading={busy} onClick={checkout}>
          {free ? "Add to library" : wallet ? `Pay ${formatUSD(gross)} ${settledToken}` : "Connect wallet to buy"}
        </Button>

        {project.acceptsOffers && !free ? (
          <Button
            full
            variant="outline"
            className="mt-2"
            icon={<Handshake className="size-4" />}
            onClick={() => setOfferOpen(true)}
          >
            Make an offer
          </Button>
        ) : null}

        <ul className="mt-5 space-y-2 text-[12px] text-mist-400">
          {[
            { icon: Lock, text: "Funds settle before files unlock - never the other way around." },
            { icon: Repeat, text: "Lifetime updates from the creator." },
            { icon: ShieldCheck, text: "30-day refund if the delivered files stop working." },
            { icon: BadgeCheck, text: "Signed download receipt in your transaction history." },
          ].map((item) => (
            <li key={item.text} className="flex gap-2.5">
              <item.icon className="mt-0.5 size-3.5 shrink-0 text-neon-400/80" />
              {item.text}
            </li>
          ))}
        </ul>

        {!free ? (
          <p className="mt-4 border-t border-white/8 pt-3 text-[11.5px] text-mist-600">
            {FEE_LABEL} is deducted from the seller&apos;s share. You pay the listed price.
          </p>
        ) : null}
      </div>

      <OfferModal open={offerOpen} onClose={() => setOfferOpen(false)} project={project} />
    </div>
  );
}

export function OfferModal({
  open,
  onClose,
  project,
}: {
  open: boolean;
  onClose: () => void;
  project: BuyableProject;
}) {
  const router = useRouter();
  const toast = useToast();
  const [amount, setAmount] = useState(Math.max(100, Math.round(project.priceCents * 0.7)));
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const max = project.priceCents - 100;
  const fee = Math.round(amount * 0.08);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          amountCents: amount,
          message: message.trim() || null,
          currency: project.currency === "ETH" ? "ETH" : "USDC",
          chain: project.chain,
          expiresInDays: 3,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error?.message ?? "Could not send the offer.");
      toast.success("Offer sent", `${project.creator.displayName} has 3 days to respond.`);
      onClose();
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
      title="Make an offer"
      description={`${project.creator.displayName} sets the price, but you can negotiate. Offers expire in 3 days.`}
      size="sm"
      footer={
        <div className="flex items-center justify-between gap-3">
          <div className="text-[12px] text-mist-500">
            <span className="tnum text-mist-200">{formatUSD(amount)}</span>
            {amount < project.priceCents ? (
              <span className="ml-1.5">
                ({Math.round((1 - amount / project.priceCents) * 100)}% off)
              </span>
            ) : null}
          </div>
          <Button onClick={submit} loading={busy} disabled={amount > max || amount < 100}>
            Send offer
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {error ? <AlertBanner tone="danger" title="Offer not sent">{error}</AlertBanner> : null}

        <Field label="Your offer (USD)" hint={`List price is ${formatUSD(project.priceCents)}. Offers below ${formatUSD(100)} are rejected.`}>
          <NumberStepper
            value={amount}
            onChange={setAmount}
            min={100}
            max={Math.max(100, max)}
            step={500}
            prefix="$"
          />
          <input
            type="range"
            min={100}
            max={Math.max(200, max)}
            step={100}
            value={Math.min(amount, Math.max(200, max))}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="mt-3 w-full accent-neon-400"
            aria-label="Offer amount"
          />
        </Field>

        <Field label="Note to the creator" hint="Tell them why this price works for you.">
          <Textarea
            rows={3}
            maxLength={600}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="We only need the core module - happy to support an update."
          />
        </Field>

        <div className="glass rounded-xl p-3.5 text-[12px] text-mist-400">
          <p className="flex items-center justify-between">
            <span>Seller receives</span>
            <span className="tnum text-mist-100">{formatUSD(amount - fee)}</span>
          </p>
          <p className="mt-1.5 flex items-center justify-between">
            <span>Platform fee ({FEE_LABEL})</span>
            <span className="tnum">{formatUSD(fee)}</span>
          </p>
        </div>

        <p className="flex items-start gap-2 text-[11.5px] leading-relaxed text-mist-600">
          <MessageSquare className="mt-0.5 size-3 shrink-0" />
          Offers are binding once accepted. Checkout stays open for 30 minutes after that.
        </p>
      </div>
    </Modal>
  );
}

/** Icon names are strings so server components can pass them safely. */
const LINK_ICONS = { globe: Globe2, github: GitBranch, file: FileText } as const;
export type LinkIcon = keyof typeof LINK_ICONS;

export function LinkRow({
  href,
  icon,
  label,
  sub,
}: {
  href: string;
  icon: LinkIcon;
  label: string;
  sub?: string;
}) {
  const Icon = LINK_ICONS[icon];
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="group flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.025] px-3.5 py-3 transition-all hover:border-neon-400/35 hover:bg-white/5"
    >
      <Icon className="size-4 text-mist-400 transition-colors group-hover:text-neon-300" />
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-medium text-mist-100">{label}</span>
        {sub ? <span className="block truncate text-[11.5px] text-mist-500">{sub}</span> : null}
      </span>
      <span className="text-mist-600 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5">↗</span>
    </a>
  );
}

export function FileSpec({
  fileName,
  fileSizeBytes,
  downloadCount,
  license,
}: {
  fileName: string | null;
  fileSizeBytes: number | null;
  downloadCount: number;
  license: string;
}) {
  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-linear-to-br from-neon-400/22 to-violet-neon/22 text-neon-200">
          <FileArchive className="size-4.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium text-mist-50">{fileName ?? "Source archive"}</p>
          <p className="mt-0.5 text-[11.5px] text-mist-500">
            {fileSizeBytes ? `${(fileSizeBytes / 1024 / 1024).toFixed(1)} MB · ` : ""}
            {downloadCount.toLocaleString()} downloads · {license}
          </p>
        </div>
      </div>
    </div>
  );
}

export function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }}
      className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2 py-1 text-[11.5px] text-mist-400 transition-colors hover:border-white/25 hover:text-mist-100"
    >
      {copied ? <Check className="size-3 text-mint" /> : <Copy className="size-3" />}
      {copied ? "Copied" : label}
    </button>
  );
}

export function RatingSummary({ avg, count }: { avg: number; count: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <Stars value={avg} size="sm" />
      <span className="tnum text-[13px] text-mist-200">{avg > 0 ? avg.toFixed(1) : "New"}</span>
      <span className="text-[12.5px] text-mist-500">
        ({count} review{count === 1 ? "" : "s"})
      </span>
    </div>
  );
}

export function TokenBadge({ symbol }: { symbol: string }) {
  const isMeme = MEMECOINS.some((m) => m.symbol === symbol);
  return (
    <Badge tone={isMeme ? "meme" : "neon"}>
      {isMeme ? <Zap className="size-3" /> : null}
      {symbol}
    </Badge>
  );
}