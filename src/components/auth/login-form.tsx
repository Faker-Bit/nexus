"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Checkbox } from "@/components/ui/input";
import { AlertBanner } from "@/components/ui/toast";
import { AuthShell, Divider, useAuthSubmit } from "@/components/auth/auth-shell";
import { WalletSignInButton, WalletSignInNote } from "@/components/auth/wallet-sign-in-button";

const HIGHLIGHTS = [
  { title: "List in one sitting", body: "Screenshots, demo, docs and the actual archive. Our wizard keeps the metadata consistent so search works." },
  { title: "Price it or negotiate", body: "Set a fixed price, or leave offers open and let the market tell you what it is worth." },
  { title: "Get paid on-chain", body: "8% flat fee. Withdraw to USDC, USDT, DAI, ETH - no monthly minimum, no subscription." },
];

export function LoginForm() {
  const { submit, busy, error, fieldErrors } = useAuthSubmit("/api/auth/login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to manage your storefront, track sales and download what you own."
      highlights={HIGHLIGHTS}
      footer={
        <>
          New here?{" "}
          <Link href="/register" className="font-medium text-neon-300 transition-colors hover:text-neon-200">
            Create an account
          </Link>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void submit({ email, password, remember });
        }}
      >
        {error ? <AlertBanner tone="danger" title="Could not sign in">{error}</AlertBanner> : null}

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
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="----------"
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
        </Field>

        <div className="flex items-center justify-between">
          <Checkbox checked={remember} onChange={setRemember} label="Keep me signed in" />
          <Link href="/forgot-password" className="text-[12.5px] text-mist-400 transition-colors hover:text-neon-200">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" full size="lg" loading={busy}>
          Sign in
        </Button>
      </form>

      <Divider />
      <WalletSignInButton />
      <WalletSignInNote />
    </AuthShell>
  );
}