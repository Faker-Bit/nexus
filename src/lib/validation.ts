import { z } from "zod";
import { CATEGORY_KEYS, LICENSE_KEYS, CHAIN_KEYS, MEME_SYMBOLS, SORT_KEYS, TOKENS, PROJECT_STATUSES } from "./constants";

export const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address.").max(160);

export const passwordSchema = z
  .string()
  .min(10, "Use at least 10 characters.")
  .max(200, "That password is unreasonably long.");

export const handleSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Handles are at least 3 characters.")
  .max(24, "Handles are at most 24 characters.")
  .regex(/^[a-z0-9_]+$/, "Use letters, numbers and underscores only.");

export const displayNameSchema = z.string().trim().min(2, "Too short.").max(48, "Too long.");

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  handle: handleSchema,
  displayName: displayNameSchema,
  acceptTerms: z.literal(true, { message: "You must accept the terms to continue." }),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password.").max(200),
  redirectTo: z.string().optional(),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const walletNonceSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address."),
  chain: z.enum(CHAIN_KEYS).default("ethereum"),
});

export const walletVerifySchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address."),
  signature: z.string().regex(/^0x[a-fA-F0-9]+$/, "Invalid signature."),
  chain: z.enum(CHAIN_KEYS).default("ethereum"),
});

const httpsUrl = z
  .string()
  .trim()
  .max(400)
  .refine((v) => v === "" || /^https?:\/\//i.test(v), "Links must start with http(s)://");

export const projectCreateSchema = z.object({
  title: z.string().trim().min(4, "Give your project a real title.").max(80),
  tagline: z.string().trim().min(12, "Add a short pitch (12+ chars).").max(160),
  description: z.string().trim().min(80, "Describe what it does (80+ chars).").max(20_000),
  category: z.enum(CATEGORY_KEYS as [string, ...string[]]),
  language: z.string().trim().max(40).optional().nullable(),
  license: z.enum(LICENSE_KEYS as [string, ...string[]]).default("proprietary"),
  tags: z.array(z.string().trim().min(1).max(28)).max(10, "Up to 10 tags.").default([]),
  priceCents: z.coerce.number().int().min(0, "Price cannot be negative.").max(10_000_000, "Contact us for larger listings."),
  currency: z.enum(["USDC", "USDT", "DAI", "ETH"]).default("USDC"),
  chain: z.enum(CHAIN_KEYS as [string, ...string[]]).default("base"),
  acceptsOffers: z.boolean().default(true),
  acceptsMeme: z.boolean().default(false),
  memeToken: z.string().trim().max(12).optional().nullable(),
  coverImage: z.string().trim().max(400).optional().nullable(),
  assets: z
    .array(
      z.object({
        kind: z.enum(["screenshot", "video", "gif", "archive"]).default("screenshot"),
        url: httpsUrl.refine((v) => v.length > 0, "Assets need a URL."),
        alt: z.string().trim().max(140).optional().nullable(),
      }),
    )
    .max(12, "Up to 12 assets.")
    .default([]),
  demoUrl: httpsUrl.optional().nullable(),
  repoUrl: httpsUrl.optional().nullable(),
  docsUrl: httpsUrl.optional().nullable(),
  websiteUrl: httpsUrl.optional().nullable(),
  previewVideo: httpsUrl.optional().nullable(),
  fileName: z.string().trim().max(120).optional().nullable(),
  fileSizeBytes: z.coerce.number().int().min(0).max(5_000_000_000).optional().nullable(),
  status: z.enum(PROJECT_STATUSES as unknown as [string, ...string[]]).default("published"),
});
export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;

export const projectUpdateSchema = projectCreateSchema.partial().extend({
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]{3,64}$/).optional(),
});

export const discoverySchema = z.object({
  q: z.string().trim().max(120).optional(),
  category: z.string().trim().max(40).optional(),
  tags: z.string().trim().max(240).optional(),
  language: z.string().trim().max(40).optional(),
  license: z.string().trim().max(40).optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  sort: z.enum(SORT_KEYS as unknown as [string, ...string[]]).default("trending"),
  featured: z.coerce.boolean().optional(),
  free: z.coerce.boolean().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  page: z.coerce.number().int().min(1).max(500).default(1),
  perPage: z.coerce.number().int().min(1).max(48).default(12),
});
export type DiscoveryInput = z.infer<typeof discoverySchema>;

export const offerCreateSchema = z.object({
  projectId: z.string().cuid().optional(),
  amountCents: z.coerce.number().int().min(100, "Offers start at $1.").max(10_000_000),
  message: z.string().trim().max(600).optional().nullable(),
  currency: z.enum(["USDC", "USDT", "DAI", "ETH"]).default("USDC"),
  chain: z.enum(CHAIN_KEYS as [string, ...string[]]).default("base"),
  memecoin: z.string().trim().max(12).optional().nullable(),
  expiresInDays: z.coerce.number().int().min(1).max(30).default(3),
});
export type OfferInput = z.infer<typeof offerCreateSchema>;

export const offerRespondSchema = z.object({
  action: z.enum(["accept", "decline"]),
  note: z.string().trim().max(400).optional().nullable(),
});

export const checkoutSchema = z.object({
  projectId: z.string().cuid(),
  licenseType: z.enum(["standard", "extended", "source"]).default("standard"),
  currency: z.string().trim().max(12).default("USDC"),
  chain: z.enum(CHAIN_KEYS as [string, ...string[]]).default("base"),
  memecoin: z.string().trim().max(12).optional().nullable(),
  offerId: z.string().cuid().optional().nullable(),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const reviewCreateSchema = z.object({
  orderId: z.string().cuid(),
  rating: z.coerce.number().int().min(1, "Pick a rating.").max(5),
  title: z.string().trim().max(80).optional().nullable(),
  body: z.string().trim().min(20, "Tell other buyers a bit more (20+ chars).").max(2000),
});

export const profileUpdateSchema = z.object({
  displayName: displayNameSchema.optional(),
  bio: z.string().trim().max(500).optional().nullable(),
  location: z.string().trim().max(80).optional().nullable(),
  website: httpsUrl.optional().nullable(),
  github: z.string().trim().max(60).optional().nullable(),
  twitter: z.string().trim().max(60).optional().nullable(),
  discord: z.string().trim().max(60).optional().nullable(),
  avatarUrl: z.string().trim().max(400).optional().nullable(),
  coverUrl: z.string().trim().max(400).optional().nullable(),
  isCreator: z.boolean().optional(),
  payoutAddress: z.string().trim().max(80).optional().nullable(),
  defaultChain: z.enum(CHAIN_KEYS as [string, ...string[]]).optional(),
});

export const connectWalletSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  chain: z.enum(CHAIN_KEYS as [string, ...string[]]).default("ethereum"),
  isPrimary: z.boolean().default(false),
});

const tokenSymbols = [...TOKENS.map((t) => t.symbol), ...MEME_SYMBOLS] as [string, ...string[]];
export const currencySchema = z.enum(tokenSymbols);