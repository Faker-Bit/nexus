"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Link2, Trash2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Switch, Textarea } from "@/components/ui/input";
import { Tabs } from "@/components/ui/tabs";
import { AlertBanner, useToast } from "@/components/ui/toast";
import { useWallet, CHAIN_BY_ID } from "@/context/wallet-context";
import { CHAINS, CHAIN_KEYS } from "@/lib/constants";
import { cn, formatDate, shortAddress } from "@/lib/utils";

type Profile = {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  github: string | null;
  twitter: string | null;
  discord: string | null;
  payoutAddress: string | null;
  defaultChain: string;
};

type WalletRow = { id: string; chain: string; address: string; label: string | null; isPrimary: boolean; createdAt: Date };

export function SettingsPanel({
  profile,
  wallets,
}: {
  profile: Profile;
  wallets: WalletRow[];
}) {
  const [tab, setTab] = useState<"profile" | "payout" | "wallets" | "danger">("profile");
  const router = useRouter();
  const toast = useToast();
  const { wallet, connect } = useWallet();

  const [form, setForm] = useState({
    displayName: profile.displayName,
    bio: profile.bio ?? "",
    location: profile.location ?? "",
    website: profile.website ?? "",
    github: profile.github ?? "",
    twitter: profile.twitter ?? "",
    discord: profile.discord ?? "",
    avatarUrl: profile.avatarUrl ?? "",
    coverUrl: profile.coverUrl ?? "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof typeof form, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  async function saveProfile() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error?.message ?? "Could not save.");
      toast.success("Profile updated");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your profile.");
      toast.error("Not saved", err instanceof Error ? err.message : undefined);
    } finally {
      setBusy(false);
    }
  }

  async function linkWallet(address: string, chain: string, isPrimary: boolean) {
    try {
      const res = await fetch("/api/me/wallets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, chain, isPrimary }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error?.message ?? "Could not link that address.");
      toast.success(isPrimary ? "Payout wallet updated" : "Wallet linked", shortAddress(address));
      router.refresh();
    } catch (err) {
      toast.error("Could not link wallet", err instanceof Error ? err.message : undefined);
    }
  }

  async function removeWallet(id: string) {
    try {
      const res = await fetch(`/api/me/wallets?id=${id}`, { method: "DELETE" });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error?.message ?? "Could not remove that wallet.");
      toast.success("Wallet removed");
      router.refresh();
    } catch (err) {
      toast.error("Could not remove wallet", err instanceof Error ? err.message : undefined);
    }
  }

  return (
    <div className="space-y-6">
      <Tabs
        tabs={[
          { key: "profile", label: "Public profile" },
          { key: "payout", label: "Payouts" },
          { key: "wallets", label: "Wallets" },
          { key: "danger", label: "Account" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "profile" ? (
        <div className="glass space-y-5 rounded-2xl p-5 sm:p-6">
          {error ? <AlertBanner tone="danger" title="Not saved">{error}</AlertBanner> : null}

          <div className="flex items-center gap-4 border-b border-white/8 pb-5">
            <span className="grid size-14 place-items-center rounded-full bg-linear-to-br from-neon-400 to-violet-neon font-display text-lg font-bold text-void">
              {profile.displayName.slice(0, 2).toUpperCase()}
            </span>
            <div>
              <p className="text-[14px] font-medium text-mist-50">@{profile.handle}</p>
              <p className="text-[12px] text-mist-500">
                Your handle is permanent - it is your storefront URL and your licence identity.
              </p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Display name" required>
              <Input value={form.displayName} onChange={(e) => set("displayName", e.target.value)} maxLength={48} />
            </Field>
            <Field label="Location">
              <Input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="Lisbon, PT" />
            </Field>
          </div>

          <Field label="Bio" hint="One or two sentences. This is the first thing buyers read.">
            <Textarea rows={3} value={form.bio} onChange={(e) => set("bio", e.target.value)} maxLength={500} />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Website">
              <Input value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://example.com" />
            </Field>
            <Field label="Avatar URL">
              <Input value={form.avatarUrl} onChange={(e) => set("avatarUrl", e.target.value)} placeholder="https://-" />
            </Field>
            <Field label="GitHub">
              <Input value={form.github} onChange={(e) => set("github", e.target.value)} placeholder="octocat" />
            </Field>
            <Field label="X / Twitter">
              <Input value={form.twitter} onChange={(e) => set("twitter", e.target.value)} placeholder="handle" />
            </Field>
            <Field label="Discord">
              <Input value={form.discord} onChange={(e) => set("discord", e.target.value)} placeholder="handle" />
            </Field>
            <Field label="Cover image URL">
              <Input value={form.coverUrl} onChange={(e) => set("coverUrl", e.target.value)} placeholder="https://-" />
            </Field>
          </div>

          <div className="flex justify-end">
            <Button onClick={saveProfile} loading={busy}>
              Save profile
            </Button>
          </div>
        </div>
      ) : null}

      {tab === "payout" ? (
        <div className="glass space-y-5 rounded-2xl p-5 sm:p-6">
          <AlertBanner tone="info" title="How payouts work">
            Buyers pay into your primary wallet address on the chosen network. There is no withdrawal step and no
            minimum balance - the moment settlement confirms, the funds are yours.
          </AlertBanner>

          <Field label="Default payout network">
            <Select
              value={profile.defaultChain}
              onChange={async (e) => {
                const res = await fetch("/api/me/profile", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ defaultChain: e.target.value }),
                });
                if (res.ok) {
                  toast.success("Default network updated");
                  router.refresh();
                }
              }}
            >
              {CHAIN_KEYS.map((key) => (
                <option key={key} value={key}>
                  {CHAINS.find((c) => c.key === key)?.label ?? key}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Payout address" hint="Where settled funds are sent.">
            <div className="flex gap-2">
              <Input value={profile.payoutAddress ?? ""} readOnly className="font-mono" />
              <Button
                variant="secondary"
                onClick={async () => {
                  await navigator.clipboard.writeText(profile.payoutAddress ?? "");
                  toast.success("Copied");
                }}
                icon={<Copy className="size-4" />}
              >
                Copy
              </Button>
            </div>
          </Field>
        </div>
      ) : null}

      {tab === "wallets" ? (
        <div className="glass space-y-5 rounded-2xl p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-[14px] font-medium text-mist-50">Linked wallets</h3>
              <p className="mt-0.5 text-[12px] text-mist-500">
                Used for identity and payouts. One address can only belong to one NEXUS account.
              </p>
            </div>
            <Button
              onClick={async () => {
                const next = await connect();
                if (next) {
                  await linkWallet(next.address, CHAIN_BY_ID[next.chainId]?.key ?? "base", wallets.length === 0);
                }
              }}
              icon={<Link2 className="size-4" />}
            >
              {wallet ? "Link current wallet" : "Connect & link"}
            </Button>
          </div>

          {wallets.length ? (
            <div className="space-y-2">
              {wallets.map((w) => (
                <div key={w.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-white/8 bg-white/[0.02] p-3.5">
                  <span className="grid size-9 place-items-center rounded-lg bg-neon-400/12 text-neon-300">
                    <Wallet className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-[12.5px] text-mist-100">{w.address}</p>
                    <p className="text-[11px] text-mist-500">
                      {CHAINS.find((c) => c.key === w.chain)?.label ?? w.chain} · linked {formatDate(w.createdAt)}
                    </p>
                  </div>
                  {w.isPrimary ? (
                    <span className="rounded-full border border-mint/26 bg-mint/8 px-2 py-0.5 text-[10.5px] text-mint">
                      Payout
                    </span>
                  ) : (
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => linkWallet(w.address, w.chain, true)}
                      icon={<Check className="size-3" />}
                    >
                      Make primary
                    </Button>
                  )}
                  {!w.isPrimary ? (
                    <button
                      onClick={() => removeWallet(w.id)}
                      className="rounded-lg p-2 text-mist-500 transition hover:bg-rose-400/10 hover:text-rose-300"
                      aria-label="Remove wallet"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-white/12 px-4 py-10 text-center text-[13px] text-mist-500">
              No wallets linked yet. Connect one to receive payouts.
            </p>
          )}
        </div>
      ) : null}

      {tab === "danger" ? (
        <div className="space-y-4">
          <div className="glass rounded-2xl p-5 sm:p-6">
            <h3 className="text-[14px] font-medium text-mist-50">Creator mode</h3>
            <p className="mt-1 text-[12.5px] text-mist-400">
              Turning this off hides your storefront from discovery. Existing purchases and licences are unaffected.
            </p>
            <div className="mt-4">
              <Switch
                checked
                onChange={async (on) => {
                  if (!on) {
                    toast.info("Creator mode stays on for accounts with sales history");
                    return;
                  }
                  const res = await fetch("/api/me/profile", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ isCreator: false }),
                  });
                  if (res.ok) {
                    toast.success("Creator mode disabled");
                    router.push("/");
                    router.refresh();
                  }
                }}
                label="Accept new buyers"
                description="Turning this off keeps your data but removes you from search and new sales."
              />
            </div>
          </div>

          <div className={cn("rounded-2xl border border-rose-400/25 bg-rose-400/[0.04] p-5 sm:p-6")}>
            <h3 className="text-[14px] font-medium text-rose-200">Delete account</h3>
            <p className="mt-1 text-[12.5px] leading-relaxed text-mist-400">
              Removes your profile, listings and personal data. Orders, receipts and creator obligations are
              retained for the legally required period, and buyers keep their licences. Email support to proceed -
              we verify each request manually.
            </p>
            <Button variant="danger" className="mt-4" disabled>
              Contact support to delete
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}