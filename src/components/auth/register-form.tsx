"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Check, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Checkbox, Counter } from "@/components/ui/input";
import { AlertBanner } from "@/components/ui/toast";
import { AuthShell, Divider, useAuthSubmit } from "@/components/auth/auth-shell";
import { WalletSignInButton, WalletSignInNote } from "@/components/auth/wallet-sign-in-button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const HIGHLIGHTS = [
  { title: "Keep 92% of every sale", body: "One flat 8% platform fee. No listing fee, no subscription, no pay-to-feature." },
  { title: "Own your audience", body: "Your buyers are yours. Export contact lists, link your own domain, keep the relationship." },
  { title: "Verified badge included", body: "Complete a quick identity check and your storefront gets the verified mark buyers filter for." },
];

const RULES = [
  { label: "At least 10 characters", test: (v: string) => v.length >= 10 },
  { label: "A lowercase letter", test: (v: string) => /[a-z]/.test(v) },
  { label: "An uppercase letter or number", test: (v: string) => /[A-Z0-9]/.test(v) },
  { label: "Not a common password", test: (v: string) => !/^(password|qwerty|letmein|admin|12345)/i.test(v) },
];

export function RegisterForm() {
  const { submit, busy, error, fieldErrors } = useAuthSubmit("/api/auth/register");
  const toast = useToast();
  const [displayName, setDisplayName] = useState("");
  const [handle, setHandle] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [terms, setTerms] = useState(false);

  const handlePreview = useMemo(() => {
    const clean = handle.toLowerCase().replace(/[^a-z0-9_]/g, "");
    return clean.slice(0, 24);
  }, [handle]);

  const passed = RULES.filter((rule) => rule.test(password));

  async function onSubmit() {
    if (!terms) {
      toast.error("Accept the terms first", "You need to agree before creating an account.");
      return;
    }
    const ok = await submit({ displayName, handle: handlePreview, email, password, acceptTerms: true });
    if (ok) toast.success("Storefront ready", "Start with your first listing.");
  }

  return (
    <AuthShell
      title="Open your storefront"
      subtitle="Free to list. You only pay when something sells."
      highlights={HIGHLIGHTS}
      footer={
        <>
          Already selling?{" "}
          <Link href="/login" className="font-medium text-neon-300 transition-colors hover:text-neon-200">
            Sign in
          </Link>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void onSubmit();
        }}
      >
        {error ? <AlertBanner tone="danger" title="Could not create account">{error}</AlertBanner> : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Display name" required error={fieldErrors.displayName}>
            <input
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Nova Arsenault"
              maxLength={48}
              className="h-11 w-full rounded-xl border border-white/10 bg-ink-900/70 px-3.5 text-sm outline-none transition-colors placeholder:text-mist-600 focus:border-neon-400/55 focus:ring-2 focus:ring-neon-400/15"
            />
          </Field>

          <Field label="Handle" required error={fieldErrors.handle} hint={`nexus.market/${handlePreview || "your-handle"}`}>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-mist-500">@</span>
              <input
                required
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="novabuilds"
                maxLength={24}
                className="h-11 w-full rounded-xl border border-white/10 bg-ink-900/70 pl-7 pr-3.5 text-sm outline-none transition-colors placeholder:text-mist-600 focus:border-neon-400/55 focus:ring-2 focus:ring-neon-400/15"
              />
            </div>
          </Field>
        </div>

        <Field label="Email" required error={fieldErrors.email}>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@studio.dev"
            className="h-11 w-full rounded-xl border border-white/10 bg-ink-900/70 px-3.5 text-sm outline-none transition-colors placeholder:text-mist-600 focus:border-neon-400/55 focus:ring-2 focus:ring-neon-400/15"
          />
        </Field>

        <Field label="Password" required error={fieldErrors.password}>
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Choose something memorable"
              className="h-11 w-full rounded-xl border border-white/10 bg-ink-900/70 px-3.5 pr-11 text-sm outline-none transition-colors placeholder:text-mist-600 focus:border-neon-400/55 focus:ring-2 focus:ring-neon-400/15"
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-mist-500 hover:text-mist-200"
            >
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {RULES.map((rule) => {
              const done = rule.test(password);
              return (
                <span
                  key={rule.label}
                  className={cn("flex items-center gap-1 text-[11.5px]", done ? "text-mint" : "text-mist-600")}
                >
                  <Check className="size-3" />
                  {rule.label}
                </span>
              );
            })}
          </div>
          <div className="mt-1 flex justify-end">
            <Counter value={password.length} max={200} />
          </div>
        </Field>

        <Checkbox
          checked={terms}
          onChange={setTerms}
          label={
            <>
              I agree to the{" "}
              <Link href="/terms" className="text-neon-300 hover:text-neon-200">
                Terms
              </Link>{" "}
              and{" "}
              <Link href="/licenses" className="text-neon-300 hover:text-neon-200">
                Licence terms
              </Link>
              .
            </>
          }
        />

        <Button type="submit" full size="lg" loading={busy} disabled={!terms || passed.length < RULES.length}>
          Create account
        </Button>
      </form>

      <Divider />
      <WalletSignInButton label="Sign up with a wallet" />
      <WalletSignInNote />
    </AuthShell>
  );
}