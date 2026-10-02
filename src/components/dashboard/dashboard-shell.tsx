"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import {
  BarChart3,
  HandCoins,
  LayoutDashboard,
  Menu,
  Plus,
  Settings,
  Store,
  Wallet,
  X,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { LogoMark } from "@/components/layout/logo-mark";
import { cn, formatUSD } from "@/lib/utils";

type DashUser = {
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  isCreator: boolean;
  totalEarningsCents: number;
};

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/projects", label: "Projects", icon: Store },
  { href: "/dashboard/sales", label: "Sales", icon: BarChart3 },
  { href: "/dashboard/offers", label: "Offers", icon: HandCoins },
  { href: "/transactions", label: "Transactions", icon: Wallet },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function DashboardShell({ user, children }: { user: DashUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const sidebar = (
    <div className="flex h-full flex-col gap-6 p-5">
      <Link href="/" className="flex items-center gap-2.5">
        <LogoMark size="sm" />
        <span className="font-display text-[15px] font-bold text-mist-50">
          NEXUS<span className="text-neon-400">.</span>
        </span>
      </Link>

      <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] p-3">
        <Avatar name={user.displayName} src={user.avatarUrl} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium text-mist-50">{user.displayName}</p>
          <p className="truncate text-[11px] text-mist-500">@{user.handle}</p>
        </div>
      </div>

      <nav className="flex flex-col gap-0.5" aria-label="Dashboard">
        {NAV.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "relative flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13.5px] transition-colors",
                active ? "text-mist-50" : "text-mist-400 hover:bg-white/5 hover:text-mist-100",
              )}
            >
              {active ? (
                <motion.span
                  layoutId="dash-active"
                  className="absolute inset-0 rounded-lg border border-neon-400/25 bg-neon-400/8"
                />
              ) : null}
              <item.icon className="relative size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3">
        <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3.5">
          <p className="text-[10.5px] uppercase tracking-wider text-mist-500">Lifetime earnings</p>
          <p className="tnum mt-1 text-[19px] font-semibold text-mist-50">{formatUSD(user.totalEarningsCents)}</p>
          <p className="mt-0.5 text-[11px] text-mist-600">after the 8% platform fee</p>
        </div>
        <ButtonLink href="/dashboard/projects/new" full size="sm" icon={<Plus className="size-4" />}>
          New project
        </ButtonLink>
      </div>
    </div>
  );

  return (
    <div className="relative mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
      {/* mobile bar */}
      <div className="mb-6 flex items-center justify-between gap-3 lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <LogoMark size="sm" />
          <span className="font-display text-[15px] font-bold text-mist-50">Dashboard</span>
        </Link>
        <button
          onClick={() => setOpen((v) => !v)}
          className="glass grid size-10 place-items-center rounded-xl text-mist-200"
          aria-label="Toggle dashboard menu"
        >
          {open ? <X className="size-4.5" /> : <Menu className="size-4.5" />}
        </button>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="glass-strong mb-6 overflow-hidden rounded-2xl lg:hidden"
          >
            {sidebar}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="grid gap-8 lg:grid-cols-[248px_1fr]">
        <aside className="glass sticky top-24 hidden h-[calc(100dvh-8rem)] overflow-y-auto rounded-2xl lg:block">
          {sidebar}
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}