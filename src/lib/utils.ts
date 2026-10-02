import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64)
    .replace(/-+$/g, "");
}

export function truncate(value: string, max: number) {
  if (value.length <= max) return value;
  return `${value.slice(0, Math.max(0, max - 1)).trimEnd()}-`;
}

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const usdPrecise = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

export function formatUSD(cents: number, opts?: { precise?: boolean }) {
  const value = cents / 100;
  if (value === 0) return "Free";
  return (opts?.precise ? usdPrecise : usd).format(value);
}

export function formatCompact(n: number) {
  if (n < 1000) return String(n);
  return compact.format(n);
}

export function formatNumber(n: number) {
  return new Intl.NumberFormat("en-US").format(n);
}

export function formatPriceWithToken(cents: number, symbol: string) {
  if (cents === 0) return "Free";
  return `${formatUSD(cents)} ${symbol}`;
}

export function formatBytes(bytes?: number | null) {
  if (!bytes || bytes <= 0) return "-";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value.toFixed(value < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

export function formatDate(input: string | Date | number) {
  const d = new Date(input);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function formatDateTime(input: string | Date | number) {
  const d = new Date(input);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function timeAgo(input: string | Date | number) {
  const then = new Date(input).getTime();
  const diff = Date.now() - then;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.round(months / 12)}y ago`;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function parseTags(tagsString: string | null | undefined, limit = 12): string[] {
  if (!tagsString) return [];
  return tagsString
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, limit);
}

export function initials(name: string) {
  return name
    .split(/[\s_.-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

/** Deterministic hue from a string - used for avatar + generated art fallbacks. */
export function hashHue(input: string) {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) % 360;
  return h;
}

export function gradientFor(seed: string) {
  const hue = hashHue(seed);
  return `linear-gradient(135deg, hsl(${hue} 85% 62%), hsl(${(hue + 58) % 360} 80% 52%))`;
}

/** Deterministic generated cover art for projects without an uploaded image. */
export function coverArtFor(seed: string) {
  const hue = hashHue(seed);
  return {
    background: `radial-gradient(120% 120% at 18% 12%, hsl(${hue} 90% 58% / 0.42), transparent 58%), radial-gradient(90% 90% at 82% 78%, hsl(${(hue + 64) % 360} 88% 56% / 0.32), transparent 60%), linear-gradient(160deg, #0a0c14, #020805)`,
    hue,
  };
}

export function ratingStars(rating: number) {
  return [0, 1, 2, 3, 4].map((i) => {
    const fill = clamp(rating - i, 0, 1);
    return fill;
  });
}

export function shortAddress(address: string, lead = 6, tail = 4) {
  if (!address) return "";
  if (address.length <= lead + tail + 2) return address;
  return `${address.slice(0, lead)}-${address.slice(-tail)}`;
}

export function txUrl(chain: string, hash: string) {
  const explorers: Record<string, string> = {
    ethereum: "https://etherscan.io/tx/",
    base: "https://basescan.org/tx/",
    arbitrum: "https://arbiscan.io/tx/",
    polygon: "https://polygonscan.com/tx/",
    solana: "https://solscan.io/tx/",
  };
  const base = explorers[chain] ?? explorers.base;
  return hash ? `${base}${hash}` : base;
}

export function safeJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function groupBy<T, K extends string | number>(items: T[], key: (item: T) => K) {
  return items.reduce<Record<K, T[]>>((acc, item) => {
    const k = key(item);
    (acc[k] ||= []).push(item);
    return acc;
  }, {} as Record<K, T[]>);
}

export function sumBy<T>(items: T[], value: (item: T) => number) {
  return items.reduce((acc, item) => acc + value(item), 0);
}

export function unique<T>(items: T[]) {
  return Array.from(new Set(items));
}

/** Tiny deterministic PRNG so server-rendered art is stable across renders. */
export function seeded(seed: string) {
  let state = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    state ^= seed.charCodeAt(i);
    state = Math.imul(state, 16777619);
  }
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}