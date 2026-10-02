"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  FileArchive,
  GripVertical,
  ImagePlus,
  Info,
  Link2,
  Rocket,
  Trash2,
  UploadCloud,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field, Input, Select, Switch, Textarea, Counter } from "@/components/ui/input";
import { AlertBanner, useToast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/modal";
import { CATEGORIES, CHAINS, LANGUAGES, LICENSES, LICENSE_TIERS, MEMECOINS, TOKENS } from "@/lib/constants";
import { cn, formatUSD } from "@/lib/utils";

type Asset = { id?: string; kind: "screenshot" | "video" | "gif" | "archive"; url: string; alt: string };

export type WizardInitial = {
  id?: string;
  title?: string;
  tagline?: string;
  description?: string;
  category?: string;
  language?: string | null;
  license?: string;
  tags?: string[];
  priceCents?: number;
  currency?: string;
  chain?: string;
  acceptsOffers?: boolean;
  acceptsMeme?: boolean;
  memeToken?: string | null;
  demoUrl?: string | null;
  repoUrl?: string | null;
  docsUrl?: string | null;
  websiteUrl?: string | null;
  previewVideo?: string | null;
  fileName?: string | null;
  fileSizeBytes?: number | null;
  status?: string;
  assets?: Asset[];
};

const STEPS = [
  { key: "basics", label: "Basics", icon: Info },
  { key: "media", label: "Media", icon: ImagePlus },
  { key: "delivery", label: "Delivery", icon: FileArchive },
  { key: "pricing", label: "Pricing", icon: Zap },
  { key: "review", label: "Review", icon: Rocket },
] as const;

type StepKey = (typeof STEPS)[number]["key"];

export function ProjectWizard({ initial }: { initial?: WizardInitial }) {
  const router = useRouter();
  const toast = useToast();
  const isEdit = Boolean(initial?.id);

  const [step, setStep] = useState<StepKey>("basics");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [assetModal, setAssetModal] = useState(false);

  const [form, setForm] = useState({
    title: initial?.title ?? "",
    tagline: initial?.tagline ?? "",
    description: initial?.description ?? "",
    category: initial?.category ?? "ai",
    language: initial?.language ?? "TypeScript",
    license: initial?.license ?? "proprietary",
    tags: initial?.tags ?? [],
    priceCents: initial?.priceCents ?? 4900,
    currency: initial?.currency ?? "USDC",
    chain: initial?.chain ?? "base",
    acceptsOffers: initial?.acceptsOffers ?? true,
    acceptsMeme: initial?.acceptsMeme ?? false,
    memeToken: initial?.memeToken ?? "PEPE",
    demoUrl: initial?.demoUrl ?? "",
    repoUrl: initial?.repoUrl ?? "",
    docsUrl: initial?.docsUrl ?? "",
    websiteUrl: initial?.websiteUrl ?? "",
    previewVideo: initial?.previewVideo ?? "",
    fileName: initial?.fileName ?? "",
    fileSizeBytes: initial?.fileSizeBytes ?? 0,
    status: initial?.status ?? "published",
  });

  const [assets, setAssets] = useState<Asset[]>(initial?.assets ?? []);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const index = STEPS.findIndex((s) => s.key === step);

  const issues = useMemo(() => {
    const list: string[] = [];
    if (form.title.trim().length < 4) list.push("Give the project a real title.");
    if (form.tagline.trim().length < 12) list.push("Write a pitch of at least 12 characters.");
    if (form.description.trim().length < 80) list.push("Describe what it does in at least 80 characters.");
    if (form.tags.length === 0) list.push("Add at least one tag so search can find it.");
    if (assets.length === 0) list.push("Add at least one screenshot.");
    return list;
  }, [form, assets]);

  function addTag(raw: string) {
    const clean = raw.trim().toLowerCase().replace(/\s+/g, "-");
    if (!clean) return;
    if (form.tags.includes(clean)) return;
    if (form.tags.length >= 10) {
      toast.error("Ten tags max", "Buyers scan the first few anyway.");
      return;
    }
    set("tags", [...form.tags, clean]);
  }

  function validateUrl(value: string) {
    if (!value) return true;
    return /^https?:\/\//i.test(value);
  }

  async function publish() {
    if (issues.length) {
      setError(issues.join(" "));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const payload = {
        title: form.title,
        tagline: form.tagline,
        description: form.description,
        category: form.category,
        language: form.language || null,
        license: form.license,
        tags: form.tags,
        priceCents: form.priceCents,
        currency: form.currency,
        chain: form.chain,
        acceptsOffers: form.acceptsOffers,
        acceptsMeme: form.acceptsMeme,
        memeToken: form.acceptsMeme ? form.memeToken : null,
        demoUrl: form.demoUrl || null,
        repoUrl: form.repoUrl || null,
        docsUrl: form.docsUrl || null,
        websiteUrl: form.websiteUrl || null,
        previewVideo: form.previewVideo || null,
        fileName: form.fileName || null,
        fileSizeBytes: form.fileSizeBytes || null,
        status: form.status,
        assets: assets.map((a) => ({ kind: a.kind, url: a.url, alt: a.alt || null })),
      };

      const res = await fetch(isEdit ? `/api/projects/${initial!.id}` : "/api/projects", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok) {
        const detail = Array.isArray(body?.error?.details)
          ? body.error.details.map((d: { message: string }) => d.message).join(" ")
          : "";
        throw new Error(`${body?.error?.message ?? "Could not save."} ${detail}`);
      }

      toast.success(isEdit ? "Project updated" : "Project published", isEdit ? undefined : "It is live in explore now.");
      router.push(`/dashboard/projects/${body.data.project.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      toast.error("Not saved", err instanceof Error ? err.message : undefined);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-7">
      {/* stepper */}
      <ol className="flex flex-wrap gap-2">
        {STEPS.map((s, i) => {
          const active = s.key === step;
          const done = i < index;
          return (
            <li key={s.key}>
              <button
                onClick={() => setStep(s.key)}
                className={cn(
                  "flex items-center gap-2 rounded-xl border px-3 py-2 text-[12.5px] font-medium transition-all",
                  active
                    ? "border-neon-400/45 bg-neon-400/10 text-neon-100"
                    : done
                      ? "border-mint/25 bg-mint/6 text-mint"
                      : "border-white/10 text-mist-400 hover:border-white/20 hover:text-mist-100",
                )}
              >
                {done ? <Check className="size-3.5" /> : <s.icon className="size-3.5" />}
                <span className="hidden sm:inline">{s.label}</span>
                <span className="tnum text-[10px] opacity-60">{i + 1}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        >
          {step === "basics" ? (
            <div className="space-y-5">
              <Field label="Project title" required hint="What would you call it in a sentence?">
                <div className="flex items-center gap-3">
                  <Input
                    value={form.title}
                    onChange={(e) => set("title", e.target.value)}
                    placeholder="Helix Agent Runtime"
                    maxLength={80}
                  />
                  <span className="shrink-0">
                    <Counter value={form.title.length} max={80} />
                  </span>
                </div>
              </Field>

              <Field
                label="One-line pitch"
                required
                hint="This shows on cards across the marketplace. Make it earn the click."
              >
                <div className="flex items-center gap-3">
                  <Input
                    value={form.tagline}
                    onChange={(e) => set("tagline", e.target.value)}
                    placeholder="Production agent runtime with tool-calling, memory graphs and cost telemetry."
                    maxLength={160}
                  />
                  <span className="shrink-0">
                    <Counter value={form.tagline.length} max={160} />
                  </span>
                </div>
              </Field>

              <Field label="Description" required hint="Markdown supported - headings, bullets, code and links.">
                <Textarea
                  rows={14}
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder={`## What it does\n\nDescribe the problem it solves-\n\n## Why buyers pick it over the free alternative\n\nBe specific.`}
                />
                <div className="flex justify-end">
                  <Counter value={form.description.length} max={20000} />
                </div>
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Category" required>
                  <Select value={form.category} onChange={(e) => set("category", e.target.value)}>
                    {CATEGORIES.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Primary stack">
                  <Select value={form.language ?? ""} onChange={(e) => set("language", e.target.value)}>
                    <option value="">Multi / other</option>
                    {LANGUAGES.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              <Field label="Tags" required hint="Up to 10. Use what a buyer would type.">
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag(tagInput);
                        setTagInput("");
                      }
                    }}
                    placeholder="agents, runtime, llm"
                  />
                  <Button
                    onClick={() => {
                      addTag(tagInput);
                      setTagInput("");
                    }}
                  >
                    Add
                  </Button>
                </div>
                {form.tags.length ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {form.tags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => set("tags", form.tags.filter((t) => t !== tag))}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/4 px-2 py-1 font-mono text-[11.5px] text-mist-300 transition-colors hover:border-rose-400/40 hover:text-rose-200"
                      >
                        {tag}
                        <X className="size-3" />
                      </button>
                    ))}
                  </div>
                ) : null}
              </Field>
            </div>
          ) : null}

          {step === "media" ? (
            <div className="space-y-6">
              <AlertBanner tone="info" title="Screenshots decide the click">
                Listings with four or more screenshots convert roughly twice as well. Lead with the payoff, not
                the file tree.
              </AlertBanner>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[13.5px] font-medium text-mist-50">
                    Assets <span className="text-mist-500">({assets.length}/12)</span>
                  </p>
                  <p className="text-[11.5px] text-mist-500">Screenshots, GIFs and a demo video.</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => setAssetModal(true)}
                  disabled={assets.length >= 12}
                  icon={<ImagePlus className="size-4" />}
                >
                  Add asset
                </Button>
              </div>

              {assets.length === 0 ? (
                <button
                  onClick={() => setAssetModal(true)}
                  className="flex w-full flex-col items-center gap-3 rounded-2xl border border-dashed border-white/14 px-6 py-14 text-center transition-colors hover:border-neon-400/40 hover:bg-white/[0.02]"
                >
                  <UploadCloud className="size-7 text-mist-500" />
                  <p className="text-[13.5px] font-medium text-mist-100">Drop screenshots here</p>
                  <p className="max-w-sm text-[12px] text-mist-500">
                    Paste a hosted image URL. In production this slot takes a direct S3/R2 upload with progress and
                    resizing.
                  </p>
                </button>
              ) : (
                <div className="space-y-2">
                  {assets.map((asset, i) => (
                    <div key={`${asset.url}-${i}`} className="glass flex items-center gap-3 rounded-xl p-3">
                      <GripVertical className="size-4 shrink-0 text-mist-600" />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={asset.url}
                        alt={asset.alt ?? ""}
                        className="size-12 shrink-0 rounded-lg border border-white/8 object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-mono text-[11.5px] text-mist-300">{asset.url}</p>
                        <p className="text-[11px] text-mist-600">{asset.kind}</p>
                      </div>
                      <button
                        onClick={() => setAssets(assets.filter((_, idx) => idx !== i))}
                        className="rounded-lg p-1.5 text-mist-500 transition hover:bg-rose-400/10 hover:text-rose-300"
                        aria-label="Remove asset"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <Field label="Demo video URL" hint="YouTube, Vimeo or a direct MP4. Shown on the listing header.">
                <Input
                  value={form.previewVideo}
                  onChange={(e) => set("previewVideo", e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=-"
                  invalid={!validateUrl(form.previewVideo)}
                />
              </Field>
            </div>
          ) : null}

          {step === "delivery" ? (
            <div className="space-y-6">
              <AlertBanner tone="warning" title="Delivery is what buyers actually pay for">
                Upload the archive to private storage. NEXUS never serves your bucket directly - each download is
                signed, counted and logged against the buyer&apos;s licence.
              </AlertBanner>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Live demo" hint="Let buyers try it before paying.">
                  <Input
                    value={form.demoUrl}
                    onChange={(e) => set("demoUrl", e.target.value)}
                    placeholder="https://demo.example.com"
                    invalid={!validateUrl(form.demoUrl)}
                  />
                </Field>
                <Field label="Source repository" hint="Public repo buyers can inspect before buying.">
                  <Input
                    value={form.repoUrl}
                    onChange={(e) => set("repoUrl", e.target.value)}
                    placeholder="https://github.com/you/project"
                    invalid={!validateUrl(form.repoUrl)}
                  />
                </Field>
                <Field label="Documentation">
                  <Input
                    value={form.docsUrl}
                    onChange={(e) => set("docsUrl", e.target.value)}
                    placeholder="https://docs.example.com"
                    invalid={!validateUrl(form.docsUrl)}
                  />
                </Field>
                <Field label="Product website">
                  <Input
                    value={form.websiteUrl}
                    onChange={(e) => set("websiteUrl", e.target.value)}
                    placeholder="https://example.com"
                    invalid={!validateUrl(form.websiteUrl)}
                  />
                </Field>
              </div>

              <div className="glass rounded-2xl p-5">
                <p className="text-[13.5px] font-medium text-mist-50">The archive</p>
                <p className="mt-1 text-[12px] text-mist-500">
                  Buyers download this file. Include source, assets and a README.
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field label="File name">
                    <Input
                      value={form.fileName}
                      onChange={(e) => set("fileName", e.target.value)}
                      placeholder="helix-runtime-v1.4.2.zip"
                    />
                  </Field>
                  <Field label="Size (bytes)" hint="Shown on the listing to set expectations.">
                    <Input
                      type="number"
                      min={0}
                      value={form.fileSizeBytes || ""}
                      onChange={(e) => set("fileSizeBytes", Number(e.target.value))}
                      placeholder="12582912"
                    />
                  </Field>
                </div>
                {form.fileSizeBytes ? (
                  <p className="mt-2 text-[11.5px] text-mist-500">
                    {(form.fileSizeBytes / 1024 / 1024).toFixed(1)} MB · buyers see this before checkout
                  </p>
                ) : null}
              </div>

              <Field label="Licence">
                <Select value={form.license} onChange={(e) => set("license", e.target.value)}>
                  {LICENSES.map((l) => (
                    <option key={l.key} value={l.key}>
                      {l.label} - {l.blurb}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          ) : null}

          {step === "pricing" ? (
            <div className="space-y-6">
              <div className="glass rounded-2xl p-5">
                <p className="text-[13.5px] font-medium text-mist-50">List price</p>
                <p className="mt-1 text-[12px] text-mist-500">
                  You keep {formatUSD(Math.round(form.priceCents * 0.92), { precise: true })} of a{" "}
                  {formatUSD(form.priceCents, { precise: true })} sale after the 8% fee.
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1">
                    {[0, 1900, 4900, 9900, 24900, 49900].map((value) => (
                      <button
                        key={value}
                        onClick={() => set("priceCents", value)}
                        className={cn(
                          "rounded-lg border px-2.5 py-1.5 text-[12px] tnum transition-all",
                          form.priceCents === value
                            ? "border-neon-400/45 bg-neon-400/10 text-neon-100"
                            : "border-white/10 text-mist-400 hover:border-white/20",
                        )}
                      >
                        {value === 0 ? "Free" : formatUSD(value)}
                      </button>
                    ))}
                  </div>
                  <div className="relative flex-1 min-w-[140px]">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-mist-500">$</span>
                    <input
                      type="number"
                      min={0}
                      value={form.priceCents / 100}
                      onChange={(e) => set("priceCents", Math.round(Number(e.target.value) * 100))}
                      className="h-11 w-full rounded-xl border border-white/10 bg-ink-900/70 pl-7 pr-3 text-sm tnum outline-none focus:border-neon-400/50"
                      aria-label="Price in dollars"
                    />
                  </div>
                </div>

                <div className="mt-4 space-y-1.5">
                  {LICENSE_TIERS.map((tier) => (
                    <div
                      key={tier.key}
                      className="flex items-center justify-between rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2 text-[12.5px]"
                    >
                      <span className="text-mist-300">{tier.label}</span>
                      <span className="text-[11px] text-mist-500">{tier.blurb}</span>
                      <span className="tnum text-mist-100">
                        {form.priceCents === 0 ? "Free" : formatUSD(Math.round(form.priceCents * tier.multiplier))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <Field label="Preferred settlement token">
                <div className="flex flex-wrap gap-2">
                  {TOKENS.map((token) => (
                    <button
                      key={token.symbol}
                      onClick={() => set("currency", token.symbol)}
                      className={cn(
                        "rounded-lg border px-3 py-2 text-[12.5px] font-medium transition-all",
                        form.currency === token.symbol
                          ? "border-neon-400/45 bg-neon-400/10 text-neon-100"
                          : "border-white/10 text-mist-400 hover:border-white/20",
                      )}
                    >
                      {token.symbol}
                      <span className="ml-1.5 text-[10.5px] text-mist-500">{token.name}</span>
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Default network">
                <div className="flex flex-wrap gap-2">
                  {CHAINS.map((chain) => (
                    <button
                      key={chain.key}
                      onClick={() => set("chain", chain.key)}
                      className={cn(
                        "rounded-lg border px-3 py-2 text-[12.5px] transition-all",
                        form.chain === chain.key
                          ? "border-white/25 bg-white/8 text-mist-50"
                          : "border-white/10 text-mist-400 hover:border-white/20",
                      )}
                    >
                      {chain.label}
                    </button>
                  ))}
                </div>
              </Field>

              <div className="glass space-y-5 rounded-2xl p-5">
                <Switch
                  checked={form.acceptsOffers}
                  onChange={(v) => set("acceptsOffers", v)}
                  label="Accept offers"
                  description="Buyers can negotiate below your list price. You accept or decline each one."
                />
                <div className="border-t border-white/8 pt-5">
                  <Switch
                    checked={form.acceptsMeme}
                    onChange={(v) => set("acceptsMeme", v)}
                    label="Accept memecoin payments"
                    description="Opt in to volatile rails for promotional sales. Settlement is still verified before delivery."
                  />
                  {form.acceptsMeme ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {MEMECOINS.map((meme) => (
                        <button
                          key={meme.symbol}
                          onClick={() => set("memeToken", meme.symbol)}
                          className={cn(
                            "rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-all",
                            form.memeToken === meme.symbol
                              ? "border-amber-300/50 bg-amber-300/12 text-amber"
                              : "border-white/10 text-mist-400 hover:border-white/20",
                          )}
                        >
                          {meme.symbol}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          {step === "review" ? (
            <div className="space-y-6">
              {error ? <AlertBanner tone="danger" title="Fix these first">{error}</AlertBanner> : null}

              {issues.length && !error ? (
                <AlertBanner tone="warning" title={`${issues.length} thing${issues.length === 1 ? "" : "s"} left`}>
                  <ul className="mt-1 space-y-0.5">
                    {issues.map((issue) => (
                      <li key={issue}>· {issue}</li>
                    ))}
                  </ul>
                </AlertBanner>
              ) : null}

              <div className="glass overflow-hidden rounded-2xl">
                <div className="border-b border-white/8 p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="neon">
                      {CATEGORIES.find((c) => c.key === form.category)?.label ?? form.category}
                    </Badge>
                    <Badge tone="glass">{form.language || "Multi"}</Badge>
                    <Badge tone="glass">{LICENSES.find((l) => l.key === form.license)?.label ?? form.license}</Badge>
                    {form.acceptsOffers ? <Badge tone="violet">Offers open</Badge> : null}
                    {form.acceptsMeme ? <Badge tone="meme">{form.memeToken} rails</Badge> : null}
                  </div>
                  <h3 className="mt-3 text-[19px] font-semibold">{form.title || "Untitled project"}</h3>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-mist-400">
                    {form.tagline || "No pitch yet - this is what buyers see on cards."}
                  </p>
                  <p className="tnum mt-4 font-display text-2xl font-semibold">
                    {formatUSD(form.priceCents, { precise: true })} <span className="text-[13px] text-mist-400">{form.currency}</span>
                  </p>
                </div>

                <dl className="grid gap-px bg-white/6 sm:grid-cols-2">
                  {[
                    { label: "Assets", value: `${assets.length} attached` },
                    { label: "Archive", value: form.fileName || "Not set" },
                    { label: "Size", value: form.fileSizeBytes ? `${(form.fileSizeBytes / 1024 / 1024).toFixed(1)} MB` : "-" },
                    { label: "Network", value: CHAINS.find((c) => c.key === form.chain)?.label ?? form.chain },
                    { label: "Demo", value: form.demoUrl ? "Linked" : "None" },
                    { label: "Repository", value: form.repoUrl ? "Linked" : "None" },
                    { label: "Description", value: `${form.description.trim().length} characters` },
                    { label: "Tags", value: form.tags.length ? form.tags.join(", ") : "None" },
                  ].map((row) => (
                    <div key={row.label} className="bg-ink-950/70 px-4 py-3">
                      <dt className="text-[10.5px] uppercase tracking-wider text-mist-500">{row.label}</dt>
                      <dd className="truncate text-[12.5px] text-mist-200">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <Field label="Visibility">
                <div className="grid gap-2 sm:grid-cols-2">
                  {[
                    { key: "published", label: "Publish now", hint: "Visible in explore and search immediately." },
                    { key: "draft", label: "Save as draft", hint: "Only you can see it. Publish whenever you are ready." },
                  ].map((option) => (
                    <button
                      key={option.key}
                      onClick={() => set("status", option.key)}
                      className={cn(
                        "rounded-xl border p-4 text-left transition-all",
                        form.status === option.key
                          ? "border-neon-400/45 bg-neon-400/8"
                          : "border-white/10 hover:border-white/20",
                      )}
                    >
                      <span className="flex items-center gap-2 text-[13.5px] font-medium text-mist-50">
                        {form.status === option.key ? <CheckCircle2 className="size-4 text-neon-300" /> : null}
                        {option.label}
                      </span>
                      <span className="mt-1 block text-[11.5px] text-mist-500">{option.hint}</span>
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          ) : null}
        </motion.div>
      </AnimatePresence>

      {/* nav */}
      <div className="flex items-center justify-between gap-3 border-t border-white/8 pt-5">
        <Button
          variant="ghost"
          onClick={() => setStep(STEPS[Math.max(0, index - 1)].key)}
          disabled={index === 0}
          icon={<ArrowLeft className="size-4" />}
        >
          Back
        </Button>

        {index < STEPS.length - 1 ? (
          <Button
            onClick={() => setStep(STEPS[index + 1].key)}
            iconRight={<ArrowRight className="size-4" />}
          >
            Continue
          </Button>
        ) : (
          <Button onClick={publish} loading={busy} size="lg" icon={<Rocket className="size-4" />}>
            {isEdit ? "Save changes" : form.status === "draft" ? "Save draft" : "Publish project"}
          </Button>
        )}
      </div>

      <AssetModal
        open={assetModal}
        onClose={() => setAssetModal(false)}
        onAdd={(asset) => {
          setAssets((prev) => [...prev, asset].slice(0, 12));
          setAssetModal(false);
        }}
      />
    </div>
  );
}

function AssetModal({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (asset: Asset) => void;
}) {
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");
  const [kind, setKind] = useState<Asset["kind"]>("screenshot");
  const [error, setError] = useState<string | null>(null);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add an asset"
      description="Paste a hosted URL. Direct uploads plug in here in production."
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (!/^https?:\/\//i.test(url)) {
                setError("That does not look like a URL.");
                return;
              }
              onAdd({ url, alt, kind });
              setUrl("");
              setAlt("");
              setError(null);
            }}
            icon={<Link2 className="size-4" />}
          >
            Add asset
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {error ? <AlertBanner tone="danger" title="Invalid URL">{error}</AlertBanner> : null}
        <Field label="Type">
          <div className="flex gap-2">
            {(["screenshot", "gif", "video", "archive"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setKind(k)}
                className={cn(
                  "flex-1 rounded-lg border px-3 py-2 text-[12.5px] capitalize transition-all",
                  kind === k ? "border-neon-400/45 bg-neon-400/10 text-neon-100" : "border-white/10 text-mist-400 hover:border-white/20",
                )}
              >
                {k}
              </button>
            ))}
          </div>
        </Field>
        <Field label="URL" required>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://cdn.example.com/screenshot-01.png"
          />
        </Field>
        <Field label="Alt text" hint="Describe the image for screen readers and SEO.">
          <Input value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Dashboard showing live order book" />
        </Field>
      </div>
    </Modal>
  );
}
