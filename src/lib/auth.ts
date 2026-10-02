import { cookies } from "next/headers";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import bcrypt from "bcryptjs";
import { verifyMessage } from "viem";
import { prisma } from "./db";
import { slugify } from "./utils";
import { ApiError } from "./api-error";

export const SESSION_COOKIE = "nexus_session";
export const NONCE_COOKIE = "nexus_wallet_nonce";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

export type SessionPayload = JWTPayload & {
  sub: string;
  handle: string;
  wallet?: string;
  authMethod?: "password" | "wallet";
};

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_SECRET must be set to at least 32 characters in production.");
    }
    return new TextEncoder().encode("dev-only-secret-change-me-nexus-marketplace-0123456789");
  }
  return new TextEncoder().encode(value);
}

const secureCookie = () => process.env.NODE_ENV === "production";

/* ------------------------------------------------------------------ passwords */

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string | null) {
  if (!hash) return false;
  return bcrypt.compare(plain, hash);
}

/** Rejects passwords that show up in every breach corpus. */
export function passwordProblems(plain: string): string[] {
  const problems: string[] = [];
  if (plain.length < 10) problems.push("Use at least 10 characters.");
  if (!/[a-z]/.test(plain)) problems.push("Add a lowercase letter.");
  if (!/[A-Z0-9]/.test(plain)) problems.push("Add an uppercase letter or a number.");
  if (/^(password|qwerty|letmein|admin|12345)/i.test(plain)) problems.push("This password is too common.");
  return problems;
}

/* ------------------------------------------------------------------ sessions */

export async function signSession(payload: Omit<SessionPayload, "iat" | "exp">) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer("nexus")
    .setAudience("nexus-web")
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), {
      issuer: "nexus",
      audience: "nexus-web",
    });
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

export async function createSessionCookie(
  user: { id: string; handle: string },
  meta: { wallet?: string; authMethod?: "password" | "wallet" } = {},
) {
  const token = await signSession({
    sub: user.id,
    handle: user.handle,
    wallet: meta.wallet,
    authMethod: meta.authMethod ?? "password",
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookie(),
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", { httpOnly: true, sameSite: "lax", secure: secureCookie(), path: "/", maxAge: 0 });
  jar.set(NONCE_COOKIE, "", { path: "/", maxAge: 0 });
}

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

const SAFE_USER_SELECT = {
  id: true,
  email: true,
  handle: true,
  displayName: true,
  avatarUrl: true,
  coverUrl: true,
  bio: true,
  location: true,
  website: true,
  github: true,
  twitter: true,
  isCreator: true,
  verified: true,
  reputation: true,
  ratingAvg: true,
  ratingCount: true,
  totalSales: true,
  totalEarningsCents: true,
  payoutAddress: true,
  defaultChain: true,
  status: true,
  createdAt: true,
} as const;

export type SessionUser = Awaited<ReturnType<typeof loadUser>>;

/** Loads the full user behind the session cookie. Returns null when logged out. */
export async function loadUser() {
  const session = await getSession();
  if (!session?.sub) return null;
  const user = await prisma.user.findUnique({ where: { id: session.sub }, select: SAFE_USER_SELECT });
  if (!user || user.status !== "active") return null;
  return user;
}

export async function requireUser() {
  const user = await loadUser();
  if (!user) throw new ApiError(401, "Sign in to continue.");
  return user;
}

export async function requireCreator() {
  const user = await requireUser();
  if (!user.isCreator) throw new ApiError(403, "Enable creator mode to do that.");
  return user;
}

/* ------------------------------------------------------------------ wallets */

export function walletMessage(address: string, nonce: string, origin: string) {
  return [
    `${origin} wants you to sign in with your Ethereum account:`,
    address,
    "",
    "This proves ownership of the wallet. It does not trigger a transaction or cost gas.",
    "",
    `URI: ${origin}`,
    "Version: 1",
    `Chain: ${origin}`,
    `Nonce: ${nonce}`,
  ].join("\n");
}

export async function issueWalletNonce(address: string) {
  const nonce = `0x${crypto.randomUUID().replace(/-/g, "")}${Date.now().toString(16)}`.slice(0, 66);
  const jar = await cookies();
  jar.set(NONCE_COOKIE, JSON.stringify({ address, nonce }), {
    httpOnly: true,
    sameSite: "none",
    secure: true,
    path: "/",
    maxAge: 600,
  });
  return nonce;
}

export async function consumeWalletNonce(address: string) {
  const jar = await cookies();
  const raw = jar.get(NONCE_COOKIE)?.value;
  jar.set(NONCE_COOKIE, "", { path: "/", maxAge: 0 });
  if (!raw) throw new ApiError(400, "Request a fresh connect signature.");
  let parsed: { address?: string; nonce?: string };
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new ApiError(400, "Malformed connect request.");
  }
  if (parsed.address?.toLowerCase() !== address.toLowerCase()) {
    throw new ApiError(400, "Signature does not match the requested address.");
  }
  if (!parsed.nonce) throw new ApiError(400, "Missing nonce.");
  return parsed.nonce;
}

export function assertSignature(address: string, signature: string, message: string) {
  const ok = verifyMessage({ address: address as `0x${string}`, message, signature: signature as `0x${string}` });
  if (!ok) throw new ApiError(401, "Signature verification failed.");
}

/** Creates a wallet-native account, or links the address to the account that owns it. */
export async function resolveWalletUser(address: string, chain: string) {
  const existing = await prisma.wallet.findUnique({ where: { chain_address: { chain, address } } });
  if (existing) {
    const user = await prisma.user.findUnique({ where: { id: existing.userId } });
    if (user && user.status === "active") return { user, created: false };
  }

  const base = slugify(`${address.slice(2, 10)}-builder`) || "builder";
  let handle = base;
  for (let i = 0; await prisma.user.findUnique({ where: { handle } }); i++) {
    handle = `${base}${i + 1}${Math.floor(Math.random() * 90 + 10)}`;
  }

  const user = await prisma.user.create({
    data: {
      email: `${address.slice(2, 12).toLowerCase()}@wallet.nexus`,
      handle,
      displayName: `${address.slice(2, 6).toUpperCase()}-${address.slice(-4).toUpperCase()}`,
      isCreator: false,
      defaultChain: chain,
      wallets: { create: { address, chain, isPrimary: true, label: "Connected wallet" } },
    },
    select: SAFE_USER_SELECT,
  });

  return { user, created: true };
}