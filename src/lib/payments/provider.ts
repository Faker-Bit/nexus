import { randomUUID, createHash } from "node:crypto";
import { feeFromCents, tokenMeta } from "../constants";

export type IntentStatus = "requires_payment" | "processing" | "confirmed" | "failed";

export interface PaymentIntent {
  id: string;
  orderId: string;
  orderReference: string;
  amountCents: number;
  sellerPayoutCents: number;
  platformFeeCents: number;
  currency: string;
  chain: string;
  tokenAddress: string | null;
  memecoin: boolean;
  status: IntentStatus;
  confirmations: number;
  requiredConfirmations: number;
  txHash: string | null;
  blockNumber: number | null;
  fromAddress: string | null;
  toAddress: string | null;
  payTo: string | null;
  expiresAt: string;
  createdAt: string;
  networkLabel: string;
  explorerUrl: string | null;
}

export interface CreateIntentInput {
  orderId: string;
  orderReference: string;
  amountCents: number;
  currency: string;
  chain: string;
  memecoin?: boolean;
  fromAddress: string;
  payTo: string;
}

export interface PaymentsProvider {
  readonly name: string;
  readonly requiredConfirmations: number;
  createIntent(input: CreateIntentInput): Promise<PaymentIntent>;
  confirm(intent: PaymentIntent): Promise<PaymentIntent>;
}

/**
 * Simulated settlement for local development and demos.
 *
 * It reproduces the shape of an on-chain transfer (tx hash, block number,
 * confirmation counting, expiry) without touching a chain, so the checkout UI,
 * order state machine and analytics can be exercised end to end. Swap in the
 * EVM provider below or point PAYMENTS_PROVIDER at a relayer service in
 * production - nothing outside this folder needs to change.
 */
class MockProvider implements PaymentsProvider {
  readonly name = "mock";
  readonly requiredConfirmations = 2;

  async createIntent(input: CreateIntentInput): Promise<PaymentIntent> {
    const token = tokenMeta(input.currency);
    const isMeme = Boolean(input.memecoin);
    const fee = feeFromCents(input.amountCents);
    return {
      id: `pi_${randomUUID().replace(/-/g, "").slice(0, 24)}`,
      orderId: input.orderId,
      orderReference: input.orderReference,
      amountCents: input.amountCents,
      sellerPayoutCents: input.amountCents - fee,
      platformFeeCents: fee,
      currency: input.currency,
      chain: input.chain,
      tokenAddress: token && !isMeme ? (token as { address?: string }).address ?? null : null,
      memecoin: isMeme,
      status: "requires_payment",
      confirmations: 0,
      requiredConfirmations: this.requiredConfirmations,
      txHash: null,
      blockNumber: null,
      fromAddress: input.fromAddress,
      toAddress: input.payTo,
      payTo: input.payTo,
      expiresAt: new Date(Date.now() + 30 * 60_000).toISOString(),
      createdAt: new Date().toISOString(),
      networkLabel: `${input.chain} · ${isMeme ? "memecoin rail" : (token?.name ?? input.currency)}`,
      explorerUrl: null,
    };
  }

  async confirm(intent: PaymentIntent): Promise<PaymentIntent> {
    const seed = createHash("sha256").update(`${intent.id}:${intent.orderId}`).digest("hex");
    const block = 22_000_000 + (parseInt(seed.slice(0, 4), 16) % 900_000);
    return {
      ...intent,
      status: "confirmed",
      confirmations: this.requiredConfirmations,
      txHash: `0x${seed}${seed.slice(0, 32)}`.slice(0, 66),
      blockNumber: block,
      explorerUrl: explorerFor(intent.chain, `0x${seed}${seed.slice(0, 32)}`.slice(0, 66)),
    };
  }
}

function explorerFor(chain: string, hash: string) {
  const map: Record<string, string> = {
    ethereum: "https://etherscan.io/tx/",
    base: "https://basescan.org/tx/",
    arbitrum: "https://arbiscan.io/tx/",
    polygon: "https://polygonscan.com/tx/",
    solana: "https://solscan.io/tx/",
  };
  return `${map[chain] ?? map.base}${hash}`;
}

const providers: Record<string, PaymentsProvider> = {
  mock: new MockProvider(),
};

export function payments(): PaymentsProvider {
  const key = (process.env.PAYMENTS_PROVIDER ?? "mock").toLowerCase();
  return providers[key] ?? providers.mock;
}

export function isSimulation() {
  return payments().name === "mock";
}