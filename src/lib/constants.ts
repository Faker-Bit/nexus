/**
 * Domain constants shared by client and server.
 * Enums live here (not in Prisma) so the exact same data runs on SQLite and Postgres.
 */

/**
 * Category hues sit on a single green axis with one cool outlier (website).
 * That keeps the marketplace reading as one brand while staying scannable.
 */
export const CATEGORIES = [
  { key: "ai", label: "AI & Agents", icon: "Sparkles", hue: "#00ff9d", blurb: "Agents, RAG stacks, model tooling" },
  { key: "bot", label: "Bots", icon: "Bot", hue: "#10e0a0", blurb: "Trading, Discord, Telegram automation" },
  { key: "app", label: "Apps", icon: "AppWindow", hue: "#a8ff5c", blurb: "Full products and desktop apps" },
  { key: "website", label: "Websites", icon: "Globe", hue: "#00e7ff", blurb: "Landing pages, studios, portfolios" },
  { key: "code", label: "Code & SDKs", icon: "Code2", hue: "#5cffc4", blurb: "Libraries, clients, datasets" },
  { key: "script", label: "Scripts", icon: "Terminal", hue: "#c9ff4d", blurb: "Automation and one-off tooling" },
  { key: "template", label: "Templates", icon: "LayoutTemplate", hue: "#12e0a0", blurb: "Starter kits, UI systems, boilerplate" },
  { key: "plugin", label: "Plugins", icon: "Plug", hue: "#9dffc4", blurb: "Drop-in modules and extensions" },
] as const;

export type CategoryKey = (typeof CATEGORIES)[number]["key"];
export const CATEGORY_KEYS = CATEGORIES.map((c) => c.key) as CategoryKey[];

export const CATEGORY_MAP: Record<string, { label: string; hue: string; icon: string }> =
  Object.fromEntries(CATEGORIES.map((c) => [c.key, { label: c.label, hue: c.hue, icon: c.icon }]));

export const CHAINS = [
  { key: "ethereum", label: "Ethereum", symbol: "ETH", explorer: "https://etherscan.io" },
  { key: "base", label: "Base", symbol: "ETH", explorer: "https://basescan.org" },
  { key: "arbitrum", label: "Arbitrum", symbol: "ETH", explorer: "https://arbiscan.io" },
  { key: "polygon", label: "Polygon", symbol: "POL", explorer: "https://polygonscan.com" },
  { key: "solana", label: "Solana", symbol: "SOL", explorer: "https://solscan.io" },
] as const;
export type ChainKey = (typeof CHAINS)[number]["key"];
export const CHAIN_KEYS = CHAINS.map((c) => c.key) as ChainKey[];

/** Stablecoins and majors a listing may be priced in. */
export const TOKENS = [
  { symbol: "USDC", name: "USD Coin", kind: "stable", address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", decimals: 6 },
  { symbol: "USDT", name: "Tether", kind: "stable", address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals: 6 },
  { symbol: "DAI", name: "Dai", kind: "stable", address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", decimals: 18 },
  { symbol: "ETH", name: "Ether", kind: "native", address: "0x0000000000000000000000000000000000000000", decimals: 18 },
] as const;

/** Memecoin rails accepted for promotional / high-volume sales. */
export const MEMECOINS = [
  { symbol: "PEPE", name: "Pepe", kind: "meme", chain: "ethereum" },
  { symbol: "WIF", name: "dogwifhat", kind: "meme", chain: "base" },
  { symbol: "BONK", name: "Bonk", kind: "meme", chain: "base" },
  { symbol: "SHIB", name: "Shiba Inu", kind: "meme", chain: "ethereum" },
] as const;

export type TokenKind = "stable" | "native" | "meme";
export const MEME_SYMBOLS = MEMECOINS.map((m) => m.symbol) as string[];

export function tokenMeta(symbol: string) {
  return (
    TOKENS.find((t) => t.symbol === symbol) ??
    MEMECOINS.find((m) => m.symbol === symbol) ??
    null
  );
}

export const LICENSES = [
  { key: "proprietary", label: "Proprietary", blurb: "Single-seat license, no redistribution." },
  { key: "mit", label: "MIT", blurb: "Use it anywhere, keep attribution." },
  { key: "apache-2.0", label: "Apache 2.0", blurb: "MIT plus an explicit patent grant." },
  { key: "gpl-3.0", label: "GPL 3.0", blurb: "Derivatives must stay open source." },
  { key: "commercial", label: "Commercial", blurb: "Extended rights, invoiced to your company." },
] as const;

export const LICENSE_KEYS = LICENSES.map((l) => l.key) as string[];
export const LICENSE_MAP: Record<string, string> = Object.fromEntries(LICENSES.map((l) => [l.key, l.label]));

export const PROJECT_STATUSES = ["draft", "published", "archived"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const ORDER_STATUSES = [
  "pending",
  "awaiting_payment",
  "paid",
  "failed",
  "refunded",
  "disputed",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const OFFER_STATUSES = ["pending", "accepted", "declined", "withdrawn", "expired", "converted"] as const;
export type OfferStatus = (typeof OFFER_STATUSES)[number];

export const SORTS = [
  { key: "trending", label: "Trending" },
  { key: "newest", label: "Newest" },
  { key: "price-asc", label: "Price: low to high" },
  { key: "price-desc", label: "Price: high to low" },
  { key: "rating", label: "Top rated" },
  { key: "best-selling", label: "Best selling" },
  { key: "updated", label: "Recently updated" },
] as const;
export type SortKey = (typeof SORTS)[number]["key"];
export const SORT_KEYS = SORTS.map((s) => s.key) as SortKey[];

export const LANGUAGES = [
  "TypeScript", "JavaScript", "Python", "Rust", "Go", "Solidity", "Node.js", "Java", "C++", "Ruby", "PHP", "Swift",
] as const;

export const LICENSE_TIERS = [
  { key: "standard", label: "Standard", multiplier: 1, blurb: "Single project, perpetual updates." },
  { key: "extended", label: "Extended", multiplier: 1.6, blurb: "Unlimited projects, priority support." },
  { key: "source", label: "Source + resale rights", multiplier: 2.4, blurb: "Full ownership, resale permitted." },
] as const;

export function platformFeeBps() {
  const raw = Number(process.env.PLATFORM_FEE_BPS ?? 800);
  return Number.isFinite(raw) ? raw : 800;
}

export function feeFromCents(cents: number) {
  return Math.round((cents * platformFeeBps()) / 10_000);
}