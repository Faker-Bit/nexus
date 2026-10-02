"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { Wallet } from "lucide-react";
import { Input } from "@/components/ui/input";
import { LogoMark } from "@/components/layout/logo-mark";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  highlights,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  highlights: Array<{ title: string; body: string }>;
}) {
  return (
    <div className="relative mx-auto grid min-h-[calc(100dvh-4.5rem)] max-w-[1400px] items-center gap-16 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:px-8">
      {/* form */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto w-full max-w-md"
      >
        <Link href="/" className="mb-8 inline-flex items-center gap-2.5">
          <LogoMark />
          <span className="font-display text-[17px] font-bold text-mist-50">
            NEXUS<span className="text-neon-400">.</span>
          </span>
        </Link>

        <h1 className="text-[clamp(1.75rem,4vw,2.4rem)] font-semibold leading-tight">{title}</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-mist-400">{subtitle}</p>

        <div className="mt-8">{children}</div>

        <div className="mt-7 text-center text-[13px] text-mist-500">{footer}</div>
      </motion.div>

      {/* pitch */}
      <motion.div
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="hidden lg:block"
      >
        <div className="glass relative overflow-hidden rounded-3xl p-9">
          <div className="pointer-events-none absolute inset-x-0 -top-24 h-48 bg-[radial-gradient(60%_100%_at_50%_100%,rgba(45,226,255,0.2),transparent_70%)]" />
          <h2 className="relative text-2xl font-semibold leading-snug">
            Everything you build, listed in an afternoon.
          </h2>
          <ul className="relative mt-8 space-y-6">
            {highlights.map((item, i) => (
              <li key={item.title} className="flex gap-4">
                <span className="tnum mt-0.5 font-mono text-[11px] text-neon-400/70">0{i + 1}</span>
                <div>
                  <p className="text-[14.5px] font-medium text-mist-50">{item.title}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-mist-400">{item.body}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="relative mt-9 flex items-center gap-3 border-t border-white/8 pt-6">
            <span className="flex items-center gap-1.5 text-[12px] text-mist-500">
              <Wallet className="size-3.5 text-mint" />
              Pay in USDC, USDT, DAI, ETH
            </span>
            <span className="size-1 rounded-full bg-white/14" />
            <span className="text-[12px] text-mist-500">8% flat fee</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function useAuthSubmit(endpoint: string) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function submit(payload: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    setFieldErrors({});
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json();

      if (!res.ok) {
        setError(body?.error?.message ?? "Something went wrong.");
        if (Array.isArray(body?.error?.details)) {
          const map: Record<string, string> = {};
          for (const issue of body.error.details) if (issue?.path?.[0]) map[issue.path[0]] = issue.message;
          setFieldErrors(map);
        }
        return false;
      }

      const next = searchParams.get("next");
      router.push(next && next.startsWith("/") ? next : (body?.data?.redirectTo ?? "/"));
      router.refresh();
      return true;
    } catch {
      setError("Could not reach the server. Check your connection.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  return { submit, busy, error, fieldErrors, setError };
}

export function Divider() {
  return (
    <div className="my-6 flex items-center gap-3">
      <span className="h-px flex-1 bg-white/8" />
      <span className="text-[11px] uppercase tracking-wider text-mist-600">or</span>
      <span className="h-px flex-1 bg-white/8" />
    </div>
  );
}

export function AuthInput({
  error,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { field?: string; error?: string }) {
  return (
    <div className={className}>
      <Input invalid={Boolean(error)} {...props} />
      {error ? (
        <p className="mt-1.5 text-[12px] text-rose-300">{error}</p>
      ) : null}
    </div>
  );
}

