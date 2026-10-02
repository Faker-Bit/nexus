"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  Sparkles,
  Store,
  Wallet,
  X,
} from "lucide-react";
import { ButtonLink, IconButton } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useScrolled, useDebounced } from "@/hooks";
import { WalletConnectButton } from "./wallet-connect-button";
import { SignOutButton } from "./sign-out-button";

type NavUser = {
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  isCreator: boolean;
  verified: boolean;
} | null;

const NAV = [
  { href: "/explore", label: "Explore" },
  { href: "/explore/creators", label: "Creators" },
  { href: "/pricing", label: "Sell" },
];

export function HeaderNav({ user }: { user: NavUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const scrolled = useScrolled(10);
  const [menuOpen, setMenuOpen] = useState(false);
  const [catsOpen, setCatsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debounced = useDebounced(query, 420);
  const catsRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMenuOpen(false);
    setCatsOpen(false);
    setAccountOpen(false);
  }, [pathname]);

  // ⌘K focuses search, Esc closes overlays.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        document.getElementById("global-search")?.focus();
      }
      if (e.key === "Escape") {
        setCatsOpen(false);
        setAccountOpen(false);
      }
    };
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!catsRef.current?.contains(target)) setCatsOpen(false);
      if (!accountRef.current?.contains(target)) setAccountOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

  useEffect(() => {
    if (debounced.trim().length > 1) {
      router.push(`/explore?q=${encodeURIComponent(debounced.trim())}`);
    }
  }, [debounced, router]);

  const isActive = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-[90] transition-all duration-300",
          scrolled ? "glass-strong hairline-b shadow-[0_10px_40px_-24px_rgba(0,0,0,0.9)]" : "bg-transparent",
        )}
      >
        <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-4 sm:px-6 lg:h-[4.5rem] lg:gap-5 lg:px-8">
          <Link href="/" className="group flex shrink-0 items-center gap-2.5" aria-label="NEXUS home">
            <span className="relative grid size-9 place-items-center rounded-xl bg-linear-to-br from-neon-300 via-neon-400 to-violet-neon shadow-[0_0_22px_-6px] shadow-neon-400/80">
              <span className="absolute inset-0 rounded-xl ring-1 ring-white/25" />
              <svg viewBox="0 0 24 24" className="size-5 text-void" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
                <path d="M4 20V4l16 16V4" />
              </svg>
            </span>
            <span className="font-display text-[17px] font-bold tracking-[-0.02em] text-mist-50">
              NEXUS<span className="text-neon-400">.</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Primary">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors",
                  isActive(item.href) ? "text-mist-50" : "text-mist-400 hover:text-mist-100",
                )}
              >
                {item.label}
                {isActive(item.href) ? (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-x-2 -bottom-0.5 h-px bg-linear-to-r from-transparent via-neon-400 to-transparent"
                  />
                ) : null}
              </Link>
            ))}

            <div className="relative" ref={catsRef}>
              <button
                onClick={() => setCatsOpen((v) => !v)}
                aria-expanded={catsOpen}
                className="flex items-center gap-1 rounded-lg px-3 py-2 text-[13.5px] font-medium text-mist-400 transition-colors hover:text-mist-100"
              >
                Categories
                <ChevronDown className={cn("size-3.5 transition-transform", catsOpen && "rotate-180")} />
              </button>
              <AnimatePresence>
                {catsOpen ? (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    transition={{ duration: 0.18 }}
                    className="glass-strong absolute left-0 top-full z-50 mt-2 w-[30rem] rounded-2xl p-2 shadow-lift"
                  >
                    <div className="grid grid-cols-2 gap-1">
                      {CATEGORIES.map((cat) => (
                        <Link
                          key={cat.key}
                          href={`/explore?category=${cat.key}`}
                          className="group flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-white/6"
                        >
                          <span
                            className="mt-0.5 size-2 shrink-0 rounded-full"
                            style={{ background: cat.hue, boxShadow: `0 0 12px ${cat.hue}` }}
                          />
                          <span className="min-w-0">
                            <span className="block text-[13px] font-medium text-mist-100 group-hover:text-white">{cat.label}</span>
                            <span className="block truncate text-[11.5px] text-mist-500">{cat.blurb}</span>
                          </span>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </nav>

          <form
            className="relative ml-auto hidden min-w-0 flex-1 md:block lg:max-w-xs"
            onSubmit={(e) => {
              e.preventDefault();
              if (query.trim()) router.push(`/explore?q=${encodeURIComponent(query.trim())}`);
            }}
            role="search"
          >
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-mist-500" />
            <input
              id="global-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search projects, creators-"
              aria-label="Search the marketplace"
              className="h-10 w-full rounded-xl border border-white/10 bg-ink-900/60 pl-9 pr-14 text-[13.5px] text-mist-100 transition-all placeholder:text-mist-600 focus:border-neon-400/50 focus:bg-ink-900/85 focus:outline-none focus:ring-2 focus:ring-neon-400/15"
            />
            <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-white/12 bg-white/6 px-1.5 py-0.5 font-mono text-[10px] text-mist-500 lg:block">
              ⌘KK
            </kbd>
          </form>

          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <WalletConnectButton />

            {user ? (
              <div className="relative" ref={accountRef}>
                <button
                  onClick={() => setAccountOpen((v) => !v)}
                  aria-expanded={accountOpen}
                  aria-label="Account menu"
                  className="flex items-center gap-2 rounded-xl p-1 pr-1.5 transition-colors hover:bg-white/6"
                >
                  <Avatar name={user.displayName} src={user.avatarUrl} verified={user.verified} size="sm" />
                  <ChevronDown className={cn("hidden size-3.5 text-mist-500 transition-transform sm:block", accountOpen && "rotate-180")} />
                </button>

                <AnimatePresence>
                  {accountOpen ? (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.97 }}
                      transition={{ duration: 0.18 }}
                      className="glass-strong absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl p-2 shadow-lift"
                    >
                      <div className="flex items-center gap-3 rounded-xl p-2.5">
                        <Avatar name={user.displayName} src={user.avatarUrl} verified={user.verified} />
                        <div className="min-w-0">
                          <p className="truncate text-[13.5px] font-medium text-mist-50">{user.displayName}</p>
                          <p className="truncate text-[11.5px] text-mist-500">@{user.handle}</p>
                        </div>
                      </div>
                      <div className="my-1.5 h-px bg-white/8" />
                      {[
                        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
                        { href: "/dashboard/projects", label: "My projects", icon: Store },
                        { href: "/library", label: "Library", icon: Sparkles },
                        { href: "/transactions", label: "Transactions", icon: Wallet },
                        { href: `/c/${user.handle}`, label: "Public profile", icon: Settings },
                      ].map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-mist-300 transition-colors hover:bg-white/6 hover:text-mist-50"
                        >
                          <item.icon className="size-3.5" />
                          {item.label}
                        </Link>
                      ))}
                      <div className="my-1.5 h-px bg-white/8" />
                      <div className="px-2.5 pb-1.5">
                        <SignOutButton className="w-full justify-start gap-2.5 px-0 text-[13px] text-mist-400 hover:bg-transparent hover:text-rose-300">
                          <LogOut className="size-3.5" />
                          Sign out
                        </SignOutButton>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            ) : (
              <div className="hidden items-center gap-2 sm:flex">
                <ButtonLink href="/login" variant="ghost" size="sm">
                  Sign in
                </ButtonLink>
                <ButtonLink href="/register" size="sm">
                  Start selling
                </ButtonLink>
              </div>
            )}

            <IconButton
              label="Open menu"
              variant="glass"
              size="sm"
              className="lg:hidden"
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? <X className="size-4.5" /> : <Menu className="size-4.5" />}
            </IconButton>
          </div>
        </div>

        <AnimatePresence>
          {menuOpen ? (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="glass-strong overflow-hidden border-t border-white/8 lg:hidden"
            >
              <div className="space-y-1 px-4 py-4">
                <Link
                  href="/explore"
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-mist-200 hover:bg-white/6"
                >
                  <Search className="size-4 text-neon-400" />
                  Search projects
                </Link>
                {NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block rounded-xl px-3 py-2.5 text-sm text-mist-200 transition-colors hover:bg-white/6"
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="pt-1 text-[11px] font-semibold uppercase tracking-wider text-mist-600">Categories</div>
                <div className="grid grid-cols-2 gap-1">
                  {CATEGORIES.map((cat) => (
                    <Link
                      key={cat.key}
                      href={`/explore?category=${cat.key}`}
                      className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[12.5px] text-mist-300 hover:bg-white/6"
                    >
                      <span className="size-1.5 rounded-full" style={{ background: cat.hue }} />
                      {cat.label}
                    </Link>
                  ))}
                </div>
                {!user ? (
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <ButtonLink href="/login" variant="secondary" size="sm">
                      Sign in
                    </ButtonLink>
                    <ButtonLink href="/register" size="sm">
                      Start selling
                    </ButtonLink>
                  </div>
                ) : null}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </header>
      <div className="h-16 lg:h-[4.5rem]" aria-hidden />
    </>
  );
}